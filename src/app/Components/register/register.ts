import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  RegisterForm: FormGroup = new FormGroup({
    UserName: new FormControl(null, [Validators.required, Validators.minLength(3)]),
    Email: new FormControl(null, [Validators.required, Validators.email]),
    Password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
    ConfirmPassword: new FormControl(null, [Validators.required])
  });

  onSubmit() {
    if (this.RegisterForm.valid) {
      console.log("Form Data:", this.RegisterForm.value);
    } else {
      console.log("Form Invalid");
    }
  }
}