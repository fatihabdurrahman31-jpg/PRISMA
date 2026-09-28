import Script from 'next/script';
import Link from 'next/link';

export default function Home() {
  return <>
    <div className="app-layout">
      <aside className="site-sidebar" id="siteSidebar" aria-label="Navigasi PRISMA">
        <div className="sidebar-top"><button className="sidebar-close" id="sidebarClose" aria-label="Tutup menu">×</button><Link className="brand" href="/" id="brand" aria-label="PRISMA, kembali ke awal"><span className="mark">◈</span><span>PRISMA</span></Link><span className="sidebar-caption">Ruang latihanmu</span></div>
        <nav className="sidebar-nav" aria-label="Navigasi utama">
          <button className="side-link" id="sideHome"><span>⌂</span> Beranda</button>
          <button className="side-link" id="sideNew"><span>✦</span> Latihan Baru</button>
          <button className="side-link" id="accountBtn"><span>▤</span> Perkembangan</button>
          <div className="sidebar-divider" />
          <button className="side-link" id="sideAbout"><span>◇</span> Tentang PRISMA</button>
          <button className="side-link" id="sideHow"><span>◷</span> Cara Kerja</button>
          <button className="side-link" id="sideScience"><span>◈</span> Dasar Ilmiah</button>
        </nav>
        <div className="sidebar-account"><span id="accountStatus">Belum masuk</span><button id="sideLogin">Daftar / Masuk</button><button id="sideLogout" hidden>Keluar</button></div>
      </aside>
      <div className="sidebar-backdrop" id="sidebarBackdrop" />
      <div className="shell">
      <header className="topbar">
        <button className="menu-toggle" id="menuToggle" aria-label="Buka menu" aria-expanded="false">☰</button><span className="topbar-title">PRISMA <small>Practice the moment. Release the outcome.</small></span>
        <button id="headerStart" className="header-cta">Mulai Sekarang <span aria-hidden="true">↗</span></button>
      </header>
      <main id="app" />
      <footer><span>© 2026 PRISMA</span><span>Ruang latihan, bukan diagnosis atau pengganti psikolog.</span></footer>
      </div>
    </div>
    <Script src="/app.js" strategy="afterInteractive" />
  </>;
}
