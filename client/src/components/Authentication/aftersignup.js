import React from 'react'
import { Link } from 'react-router-dom'

function aftersignup() {
  return (
    <>
    <div className="auth-wrapper">
        <div className="auth-inner">
<h3>Your Uniqe Id has been sended to your mobile number ,<br></br> Now login with Uniqe Id
</h3>
<Link to={"/sign-in"}>Login</Link>
    </div>
    </div>
    </>
  )
}

export default aftersignup