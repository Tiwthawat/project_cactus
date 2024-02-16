import React from 'react'



export default function Login() {
  return (
    <>
      <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="bg-slate-100 col-xl-10 col-xxl-8 px-4 py-5">
          <div className="row align-items-center g-lg-5 py-5">
            <div className="col-md-10 mx-auto col-lg-5">
              <center>
                <h3 className="text-black">บัญชีของฉัน</h3>
                <center>
                  <a href="/login">
                    <button type="button" className="btn btn-outline-dark">
                      เข้าสู่ระบบ
                    </button>
                  </a>
                  <>  </>
                  <a href="/register">
                    <button type="button" className="btn btn-outline-dark">
                      ลงทะเบียน
                    </button>{" "}
                  </a>
                </center>
                <br />
              </center>
              <form className='flex-col items-center'>
                <div className="mb-3 ml-80 text-black ">
                  <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                  <input type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                  <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
                </div>
                <div className="mb-3 ml-80  text-black ">
                  <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                  <input type="password" className="form-control" id="exampleInputPassword1" />
                </div>
                <div className="mb-3  ml-80  form-check">
                  <input type="checkbox" className="form-check-input" id="exampleCheck1" />
                  <label className="form-check-label text-black" htmlFor="exampleCheck1">Check me out</label>
                </div>
                <button type="submit" className="btn  ml-80 text-black  btn-primary">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}