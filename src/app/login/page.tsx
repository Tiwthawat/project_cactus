//login/page.tsx
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


export default function Login() {
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
        <div className="border items-center border-gray-300 rounded p-4">

          <Typography component="h1" variant="h5" className="text-black  pt-5 text-center">
            Sign in
          </Typography>
          <form onSubmit={handleSubmit} className="mt-1">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
              labelPlacement="end" // ใช้ labelPlacement เพื่อกำหนดสไตล์ของข้อความภายใน FormControlLabel
              style={{ color: 'black' }} // กำหนดสไตล์ของ FormControlLabel ให้ทั้งหมดเป็นสีดำ
            />

            <Button
              variant="contained"
              className="w-full submit mt-3 mb-2 bg-green-500 hover:bg-green-600"
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
      </Container>

    </div>

  );
}
