"use client"

import  { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../lib/firebase"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem("isAuthenticated", "true")
      navigate("/dashboard")
    } catch (err) {
      setError("Identifiants incorrects ou problème de connexion")
    }
  }

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{
        background: "#fff",
        height: "95vh", // Slightly smaller than full viewport height
        overflow: "hidden", // Prevents scrolling
      }}
    >
      <div
        className="row border rounded-5 p-4 bg-white shadow box-area"
        style={{
          width: "1000px",
          height: "600px",
        }}
      >
        {/* Left Box */}
        <div
          className="col-md-6 rounded-4 d-flex justify-content-center align-items-center flex-column left-box"
          style={{
            background: "#103cbe",
            height: "100%",
          }}
        >
          <div className="featured-image mb-3">
            <img src="/1.png" className="img-fluid" alt="Featured" style={{ width: "300px" }} />
          </div>
          <p
            className="text-white fs-2"
            style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 600 }}
          ></p>
          <small
            className="text-white text-wrap text-center"
            style={{
              width: "20rem",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            Gérez les <span style={{ color: "#FFD700" }}>absences</span> de vos employés facilement
          </small>
        </div>

        {/* Right Box */}
        <div className="col-md-6 right-box d-flex flex-column justify-content-center" style={{ padding: "50px" }}>
          <form onSubmit={handleLogin}>
            <div className="header-text mb-4">
              <h2 style={{ fontSize: "2rem" }}>Bonjour, encore une fois !</h2>
              <p style={{ fontSize: "1.2rem" }}>Nous sommes ravis de vous revoir.</p>
            </div>

            {/* Email Field */}
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control form-control-lg bg-light fs-5"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="input-group mb-4">
              <input
                type="password"
                className="form-control form-control-lg bg-light fs-5"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Checkbox and Forgot Password */}
            <div className="input-group mb-5 d-flex justify-content-between">
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="formCheck" />
                <label htmlFor="formCheck" className="form-check-label text-secondary">
                  <small>Remember Me</small>
                </label>
              </div>
            </div>

            {/* Login Button */}
            <div className="input-group mb-3">
              <button className="btn btn-lg btn-primary w-100 fs-5">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

