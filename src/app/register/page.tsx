'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

export default function Register() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
      password: data.get('password'),
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center">
      <Container component="main" maxWidth="xs">
        <div className="border border-gray-300 rounded p-4">
          <Typography component="h1" variant="h5" className="text-black pt-5 text-center">
            Sign up
          </Typography>
          <form onSubmit={handleSubmit} className="mt-3">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="I want to receive inspiration, marketing promotions and updates via email."
                  labelPlacement="end" // ใช้ labelPlacement เพื่อกำหนดสไตล์ของข้อความภายใน FormControlLabel
                  style={{ color: 'black' }} // กำหนดสไตล์ของ FormControlLabel ให้ทั้งหมดเป็นสีดำ
                />

               
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="mt-3 bg-green-500 hover:bg-green-600 text-white"
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
      </Container>
    </div>
  );
}


// import React from 'react'

// export default function Register() {
//   return (
//     <div className="container text-black bg-slate-100 col-xl-10 col-xxl-8 px-4 py-5">
//       <div className="row align-items-center g-lg-5 py-5">
//         <div className="col-md-10 ml-48 mr-48 mx-auto col-lg-5">
//           <center>
//             <h1 className=' text-3xl'>~~~~~~~~~~~~~~~~  สำหรับการสมัครสมาชิก  ~~~~~~~~~~~~~~~~</h1>
//           </center>
//           <form className="p-4 p-md-5 border rounded-3 bg-body-tertiary">
//             <legend className="mb-4">สำหรับการสมัครสมาชิก</legend>
//             <div className="mb-3">
//               <div className="mb-3">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputEmail" className="mb-2">Email:</label>
//                   <input
//                     type="email"
//                     className="form-control"
//                     id="floatingInputEmail"
//                     placeholder="name@example.com"
//                   />
//                 </div>
//               </div>
//               <div className="">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputPassword" className="mb-2">Password</label>
//                   <input
//                     type="password"
//                     className="form-control"
//                     id="floatingInputPassword"
//                     placeholder="Password"
//                   />
//                 </div>
//               </div>
//             </div>
//             <div className="row mb-3">
//               <div className="col-md-6">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputFirstName" className="mb-2">First Name</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputFirstName"
//                     placeholder="First Name"
//                   />
//                 </div>
//               </div>
//               <div className="col-md-6">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputLastName" className="mb-2">Last Name</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputLastName"
//                     placeholder="Last Name"
//                   />
//                 </div>
//               </div>
//             </div>
//             <div className="form-floating mb-2">
//               <label htmlFor="floatingInputPhone" className="mb-2">Phone</label>
//               <input
//                 type="tel"
//                 className="form-control"
//                 id="floatingInputPhone"
//                 placeholder="123-456-7890"
//               />
//             </div>
//             <div className="row mb-3">
//               <div className="col-md-6 offset-md-6">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputGender" className="mb-2">Gender</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputGender"
//                     placeholder="Gender"
//                   />
//                 </div>
//               </div>
//               <div className="col-md-6 offset-md-6">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputZip" className="mb-2">Zip Code</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputZip"
//                     placeholder="Zip Code"
//                   />
//                 </div>
//               </div>
//               <div className="col-md-6 offset-md-6">
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputZip" className="mb-2">บ้านเลขที่ / หมู่บ้าน</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputZip"
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputZip" className="mb-2">แขวง /ตำบล</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputZip"
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputZip" className="mb-2">เขต / อำเภอ</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputZip"
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="form-floating mb-2">
//                   <label htmlFor="floatingInputZip" className="mb-2">จังหวัด</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="floatingInputZip"
//                     placeholder=""
//                   />
//                 </div>
//               </div>
//             </div>
//             <button className="w-100 btn btn-lg text-white bg-black" type="submit">
//               สมัครสมาชิก
//             </button>
//             <button className="w-100 btn btn-lg ml-10 text-white  bg-red-500" type="submit">
//               ล้างค่า
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }