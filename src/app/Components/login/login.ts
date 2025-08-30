import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    this.errorMessage = null;
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    // console.log('Attempting login with:', { email, password });

    // Use proxy configuration to avoid CORS issues
    fetch('/api/Warehouse/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
      .then(async (response) => {
        // console.log('Response status:', response.status);
        // console.log('Response headers:', response.headers);

        this.isLoading = false;

        if (response.status === 200 || response.status === 201) {
          // Parse the response to get the token
          const responseData = await response.json();
          // console.log('Login response:', responseData);

          // Store the token in localStorage
          if (responseData.token) {
            localStorage.setItem('authToken', responseData.token);
            localStorage.setItem(
              'warehouseData',
              JSON.stringify(responseData.warehouse)
            );
            localStorage.setItem(
              'warehouseId',
              responseData.warehouse.id.toString()
            );
            // console.log('Token stored successfully');
          }

          // Success - navigate to home page
          // console.log('Login successful, navigating to home');
          this.router.navigate(['/dashboard/home']);
        } else if (response.status === 401) {
          // Unauthorized - wrong credentials
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (response.status === 400) {
          // Bad request - invalid data
          const errorData = await response.json();
          throw new Error(errorData.message || 'بيانات غير صحيحة');
        } else {
          // Other errors
          const errorText = await response.text();
          throw new Error(errorText || 'حدث خطأ في تسجيل الدخول');
        }
      })
      .catch((error) => {
        // console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.message || 'حدث خطأ في تسجيل الدخول';
      });
  }
}
