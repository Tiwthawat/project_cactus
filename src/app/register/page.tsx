import React from 'react'

export default function Register() {
  return (
    <div className="container text-black bg-slate-100 col-xl-10 col-xxl-8 px-4 py-5">
      <div className="row align-items-center g-lg-5 py-5">
        <div className="col-md-10 ml-48 mr-48 mx-auto col-lg-5">
          <center>
            <h1 className=' text-3xl'>~~~~~~~~~~~~~~~~  สำหรับการสมัครสมาชิก  ~~~~~~~~~~~~~~~~</h1>
          </center>
          <form className="p-4 p-md-5 border rounded-3 bg-body-tertiary">
            <legend className="mb-4">สำหรับการสมัครสมาชิก</legend>
            <div className="mb-3">
              <div className="mb-3">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputEmail" className="mb-2">Email:</label>
                  <input
                    type="email"
                    className="form-control"
                    id="floatingInputEmail"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div className="">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputPassword" className="mb-2">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="floatingInputPassword"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputFirstName" className="mb-2">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputFirstName"
                    placeholder="First Name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputLastName" className="mb-2">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputLastName"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>
            <div className="form-floating mb-2">
              <label htmlFor="floatingInputPhone" className="mb-2">Phone</label>
              <input
                type="tel"
                className="form-control"
                id="floatingInputPhone"
                placeholder="123-456-7890"
              />
            </div>
            <div className="row mb-3">
              <div className="col-md-6 offset-md-6">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputGender" className="mb-2">Gender</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputGender"
                    placeholder="Gender"
                  />
                </div>
              </div>
              <div className="col-md-6 offset-md-6">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputZip" className="mb-2">Zip Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputZip"
                    placeholder="Zip Code"
                  />
                </div>
              </div>
              <div className="col-md-6 offset-md-6">
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputZip" className="mb-2">บ้านเลขที่ / หมู่บ้าน</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputZip"
                    placeholder=""
                  />
                </div>
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputZip" className="mb-2">แขวง /ตำบล</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputZip"
                    placeholder=""
                  />
                </div>
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputZip" className="mb-2">เขต / อำเภอ</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputZip"
                    placeholder=""
                  />
                </div>
                <div className="form-floating mb-2">
                  <label htmlFor="floatingInputZip" className="mb-2">จังหวัด</label>
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInputZip"
                    placeholder=""
                  />
                </div>
              </div>
            </div>
            <button className="w-100 btn btn-lg text-white bg-black" type="submit">
              สมัครสมาชิก
            </button>
            <button className="w-100 btn btn-lg ml-10 text-white  bg-red-500" type="submit">
              ล้างค่า
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}