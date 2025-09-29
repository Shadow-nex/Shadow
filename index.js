export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "50px", background: "#f5f5f5" }}>
      <header style={{ background: "#0070f3", color: "white", padding: "20px", borderRadius: "10px" }}>
        <h1>🤖 Rin-Itoshi Bot</h1>
        <p>Tu asistente para WhatsApp con muchas funciones increíbles 🚀</p>
      </header>

      <section style={{ marginTop: "40px" }}>
        <h2>✨ Funcionalidades</h2>
        <ul style={{ listStyle: "none", padding: 0, maxWidth: "500px", margin: "20px auto", textAlign: "left" }}>
          <li>👋 Bienvenida personalizada</li>
          <li>🎮 Juegos (tic tac toe, RPG, etc.)</li>
          <li>🎵 Descarga de música y videos de YouTube</li>
          <li>💬 Chatbot automático</li>
          <li>🎨 Creación de stickers (imagen, video, GIF, URL)</li>
          <li>⚡ Comandos de administración de grupos</li>
        </ul>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>📎 Enlaces</h2>
        <p>
          🔗 <a href="https://github.com/Yuji-XDev/Rin-Itoshi-Bot" target="_blank" rel="noreferrer">
            Repositorio en GitHub
          </a>
        </p>
      </section>

      <footer style={{ marginTop: "60px", fontSize: "14px", color: "#555" }}>
        <p>Desarrollado por <b>Yuji-XDev</b> con ❤️</p>
      </footer>
    </main>
  );
}