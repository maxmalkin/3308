import Link from "next/link"; //general Navbar file -> Make it look different based on logged in versus not

const isLoggedIn = true
const userName = "temp_user"

export default function Navbar() {
  


  return (
    
    <nav className="border-b bg-white px-6 py-4 flex items-center justify-between">


        {/* website name - to be always shown */}
        <Link href="/" className="text-xl font-bold">
          PillarBoxd
        </Link>

        {isLoggedIn ? (
        // logged in
        <ul className="flex items-center gap-6">
          <li className="nav-item">
            <Link className="nav-link" href="/log">Log</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/queue">Queue</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href="/recommendations">Recommendations</Link>
          </li>
          <li className="nav-item">
            <Link href="/account">
              <img
                src="/default-avatar.png"
                alt="Account"
                width={36}
                height={36}
                style={{ borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
              />
            </Link>
          </li>
        </ul>
      ) : (
        // when not logged in
        <ul className="flex items-center gap-6">
          <li >
            <Link className="nav-link" href="/login">Log In</Link>
          </li>
          <li >
            <Link href="/register" className="btn btn-outline-light">
              Register
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}

//when logged out -> only login + register
