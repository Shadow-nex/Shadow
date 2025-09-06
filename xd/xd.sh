#!/usr/bin/env bash
set -Eeuo pipefail

# === Pretty logging ===
c_reset='\033[0m'; c_ok='\033[1;32m'; c_info='\033[1;34m'; c_warn='\033[1;33m'; c_err='\033[1;31m'
ok(){ echo -e "${c_ok}[OK]${c_reset} $*"; }
info(){ echo -e "${c_info}[INFO]${c_reset} $*"; }
warn(){ echo -e "${c_warn}[WARN]${c_reset} $*"; }
err(){ echo -e "${c_err}[ERR]${c_reset} $*" >&2; }
trap 'err "Fallo en la línea $LINENO"; exit 1' ERR

# === Defaults ===
REPO=""
BRANCH="main"
APP_NAME="whatsapp-bot"
APP_PORT="3000"
APP_DIR=""
IS_TERMUX="false"

usage() {
  cat <<EOF
Uso:
  $(basename "$0") --repo <URL_GIT> [--branch main] [--name whatsapp-bot] [--port 3000]

Ejemplo:
  $(basename "$0") --repo https://github.com/usuario/mi-bot.git --name RinItoshi --branch main --port 3000
EOF
}

# === Parse args ===
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --name) APP_NAME="${2:-}"; shift 2 ;;
    --port) APP_PORT="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) err "Flag desconocida: $1"; usage; exit 1 ;;
  esac
done

[[ -z "$REPO" ]] && { err "Debes especificar --repo"; usage; exit 1; }

# === Detect environment ===
if [[ -n "${PREFIX-}" ]] && command -v pkg >/dev/null 2>&1; then
  IS_TERMUX="true"
  APP_DIR="$HOME/$APP_NAME"
else
  IS_TERMUX="false"
  APP_DIR="/opt/$APP_NAME"
  if [[ $EUID -ne 0 ]]; then
    err "Ejecuta como root (sudo) en Linux no-Termux."; exit 1
  fi
fi

info "Entorno Termux: $IS_TERMUX"
info "Directorio de app: $APP_DIR"

# === Install dependencies ===
install_termux() {
  info "Instalando dependencias en Termux…"
  pkg update -y
  pkg install -y git nodejs-lts ffmpeg jq
  # pnpm via corepack
  corepack enable || true
  corepack prepare pnpm@latest --activate
  npm i -g pm2
}

install_debian() {
  info "Instalando dependencias en Debian/Ubuntu…"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg git ffmpeg jq
  # NodeSource Node 20 LTS
  if ! command -v node >/dev/null 2>&1; then
    info "Instalando Node.js 20 (NodeSource)…"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  # pnpm via corepack (incluido con Node >=16)
  corepack enable || true
  corepack prepare pnpm@latest --activate
  npm i -g pm2
}

if [[ "$IS_TERMUX" == "true" ]]; then
  install_termux
else
  install_debian
fi

ok "Node: $(node -v), pnpm: $(pnpm -v), PM2: $(pm2 -v)"

# === Create app directory ===
info "Creando directorio $APP_DIR…"
mkdir -p "$APP_DIR"

# En Linux no-Termux, dar permisos a usuario no-root si se ejecuta con sudo
if [[ "$IS_TERMUX" == "false" ]]; then
  SUDO_USER_NAME="${SUDO_USER:-root}"
  chown -R "$SUDO_USER_NAME":"$SUDO_USER_NAME" "$APP_DIR"
fi

# === Clone repo ===
if [[ -d "$APP_DIR/.git" ]]; then
  info "Repositorio ya existe. Actualizando…"
  git -C "$APP_DIR" fetch --all
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --rebase
else
  info "Clonando $REPO (rama $BRANCH)…"
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$APP_DIR"
fi

# === .env template si no existe ===
if [[ ! -f "$APP_DIR/.env" && ! -f "$APP_DIR/.env.local" ]]; then
  info "Creando .env de ejemplo…"
  cat > "$APP_DIR/.env" <<ENV
# === Variables de ejemplo ===
PORT=$APP_PORT
# SESSION_ID=coloca_tu_sesion
# API_KEYS=clave1,clave2
ENV
fi

# === Install dependencies (pnpm) ===
info "Instalando dependencias con pnpm…"
cd "$APP_DIR"
pnpm install --frozen-lockfile || pnpm install

# === Build (opcional) ===
if [[ -f "package.json" ]] && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  info "Compilando proyecto (pnpm build)…"
  pnpm build || warn "Fallo build (ignorando si no aplica)"
fi

# === PM2 ecosystem ===
ECOSYSTEM_FILE="$APP_DIR/ecosystem.config.cjs"
if [[ ! -f "$ECOSYSTEM_FILE" ]]; then
  info "Creando ecosystem PM2…"
  cat > "$ECOSYSTEM_FILE" <<'PM2CONF'
module.exports = {
  apps: [{
    name: process.env.APP_NAME || 'whatsapp-bot',
    script: process.env.SCRIPT || 'node',
    args: process.env.ARGS || 'index.js',
    cwd: process.env.WORKDIR || __dirname,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000'
    },
    max_memory_restart: '512M',
    autorestart: true
  }]
}
PM2CONF
fi

# Ajustes dinámicos
export APP_NAME
export PORT="$APP_PORT"
export WORKDIR="$APP_DIR"

# Detectar script de arranque
if [[ -f "index.js" ]]; then
  SCRIPT="node"
  ARGS="index.js"
elif [[ -f "dist/index.js" ]]; then
  SCRIPT="node"
  ARGS="dist/index.js"
elif jq -e '.scripts.start' package.json >/dev/null 2>&1; then
  SCRIPT="pnpm"
  ARGS="start"
else
  SCRIPT="node"
  ARGS="index.js"
  warn "No se encontró script claro; intentando con $ARGS"
fi

# === Start with PM2 ===
info "Iniciando con PM2 ($APP_NAME)…"
pm2 start "$ECOSYSTEM_FILE" --only "$APP_NAME" --update-env \
  --env "APP_NAME=$APP_NAME,PORT=$APP_PORT,SCRIPT=$SCRIPT,ARGS=$ARGS,WORKDIR=$APP_DIR" || true

pm2 save

# === Autostart ===
if [[ "$IS_TERMUX" == "false" ]] && command -v systemctl >/dev/null 2>&1; then
  info "Habilitando inicio automático con systemd…"
  # Configura startup para el usuario sudoer si existe
  TARGET_USER="${SUDO_USER:-root}"
  su - "$TARGET_USER" -c "pm2 startup systemd -u $TARGET_USER --hp $(getent passwd "$TARGET_USER" | cut -d: -f6)"
  systemctl enable pm2-"$TARGET_USER"
  systemctl start pm2-"$TARGET_USER"
else
  warn "Sin systemd (Termux u otros). Para autostart en Termux usa Termux:Boot y un script 'pm2 resurrect'."
fi

# === Firewall (opcional) ===
if [[ "$IS_TERMUX" == "false" ]] && command -v ufw >/dev/null 2>&1; then
  if [[ -n "$APP_PORT" ]]; then
    info "Abriendo puerto $APP_PORT en UFW (si está activo)…"
    ufw allow "$APP_PORT"/tcp || true
  fi
fi

ok "¡Listo! App: $APP_NAME"
ok "Ruta: $APP_DIR"
ok "PM2 status:"
pm2 status | sed -n "1,12p"
echo
info "Comandos útiles:"
echo "  pm2 logs $APP_NAME     # Ver logs"
echo "  pm2 restart $APP_NAME  # Reiniciar"
echo "  pm2 stop $APP_NAME     # Detener"
echo "  pm2 delete $APP_NAME   # Borrar de PM2"