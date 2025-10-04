<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Shadow.xyz</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg-dark: #0d0d0d;
      --accent: #ff1744;
      --text: #fff;
      --card-bg: rgba(20, 20, 20, 0.85);
    }

    body {
      margin: 0;
      font-family: "Poppins", sans-serif;
      background: var(--bg-dark);
      color: var(--text);
      overflow-x: hidden;
    }

    #particles {
      position: fixed;
      width: 100%;
      height: 100%;
      z-index: -1;
      background: var(--bg-dark);
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1em 2em;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      border-bottom: 2px solid var(--accent);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    nav .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: bold;
      font-size: 1.2em;
      color: var(--accent);
    }

    nav img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      border: 2px solid var(--accent);
    }

    nav .links {
      display: flex;
      gap: 1em;
    }

    nav a {
      text-decoration: none;
      color: var(--text);
      font-weight: bold;
      position: relative;
    }

    nav a::after {
      content: "";
      position: absolute;
      width: 0;
      height: 2px;
      background: var(--accent);
      left: 0;
      bottom: -4px;
      transition: 0.3s;
    }

    nav a:hover::after, nav a.active::after {
      width: 100%;
    }

    #content {
      max-width: 900px;
      margin: 3em auto;
      padding: 2em;
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: 0 0 20px rgba(255,23,68,0.3);
      animation: fadeIn 0.6s ease;
    }

    h1, h2 {
      color: var(--accent);
    }

    .btn {
      display: inline-block;
      padding: 0.8em 1.5em;
      background: var(--accent);
      color: #fff;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: scale(1.05);
    }

    footer {
      text-align: center;
      padding: 1em;
      border-top: 2px solid var(--accent);
      margin-top: 3em;
      background: rgba(0,0,0,0.8);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .command-category {
      margin-bottom: 1.5em;
    }

    .command-category h3 {
      color: var(--accent);
      margin-bottom: 0.5em;
    }

    .command-list {
      list-style: none;
      padding-left: 1em;
    }

    .command-list li {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <canvas id="particles"></canvas>

  <nav>
    <div class="logo">
      <img src="https://files.catbox.moe/c2sewn.jpg" alt="Shadow.xyz">
      Shadow.xyz
    </div>
    <div class="links">
      <a href="#home" class="active">home</a>
      <a href="#comandos">Comandos</a>
      <a href="#contacto">Contacto</a>
    </div>
  </nav>

  <div id="content">
    <h1>Bienvenido a Shadow.xyz</h1>
    <p>
      Soy el creador de <b>Rin Itoshi Bot MD</b>, un bot de WhatsApp lleno de funciones 🔥.
    </p>
    <a href="https://whatsapp.com/channel/0029VbAtbPA84OmJSLiHis2U" class="btn" target="_blank">Unirme al Canal 🚀</a>
  </div>

  <footer>
    © 2025 Shadow.xyz | Diseñado con ❤️ por <a href="https://github.com/Yuji-XDev" target="_blank">Yuji-XDev</a>
  </footer>

  <script>
    // 🎇 Navegación
    document.querySelectorAll("nav a").forEach(link=>{
      link.addEventListener("click", async e=>{
        e.preventDefault();
        document.querySelectorAll("nav a").forEach(l=>l.classList.remove("active"));
        e.target.classList.add("active");

        if(e.target.getAttribute("href") === "#comandos") {
          document.getElementById("content").innerHTML = "<h1>Comandos</h1><p>Cargando comandos desde GitHub... ⏳</p>";
          
          try {
            let res = await fetch("https://api.github.com/repos/Yuji-XDev/Rin-Itoshi-Bot/contents/plugins");
            let data = await res.json();

            let html = "<h1>📦 Comandos del Bot</h1>";
            for (let file of data) {
              if (file.type === "file" && file.name.endsWith(".js")) {
                let category = file.path.split("/")[1] || "Otros";
                if (!html.includes(`<h3>${category}</h3>`)) {
                  html += `<div class='command-category'><h3>${category}</h3><ul class='command-list' id='cat-${category}'></ul></div>`;
                }
                html += `<script>document.getElementById('cat-${category}').innerHTML += "<li>${file.name.replace('.js','')}</li>";</script>`;
              }
            }
            document.getElementById("content").innerHTML = html;
          } catch(err) {
            document.getElementById("content").innerHTML = "<h1>Error 🚨</h1><p>No se pudieron cargar los comandos.</p>";
          }
        } else {
          document.getElementById("content").innerHTML =
            "<h1>"+e.target.textContent+"</h1><p>Sección en construcción 🚧</p>";
        }
      });
    });

    // 🎆 Partículas básicas
    const canvas=document.getElementById("particles");
    const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    const particles=[];
    for(let i=0;i<100;i++){
      particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,dx:(Math.random()-0.5),dy:(Math.random()-0.5)});
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="rgba(255,23,68,0.7)";
      particles.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();
        p.x+=p.dx;
        p.y+=p.dy;
        if(p.x<0||p.x>canvas.width)p.dx*=-1;
        if(p.y<0||p.y>canvas.height)p.dy*=-1;
      });
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>