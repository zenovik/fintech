import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserStateService } from '../../services/user-state.service';
import { RoleApiService } from '../../../roles/services/role-api.service';
import { USER_STATUSES } from '../../constants/user.constants';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly roleApi = inject(RoleApiService);
  readonly state = inject(UserStateService);
  readonly statuses = USER_STATUSES.filter((s) => s !== 'locked');
  isEdit = false;
  userId: number | null = null;
  roles: { id: number; name: string }[] = [];

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: [''],
    status: ['pending', Validators.required],
    roleIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.roleApi.list().subscribe({ next: (d) => this.roles = d.items.map((r) => ({ id: r.id, name: r.name })) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.isEdit = true;
      this.userId = Number(id);
      this.form.get('password')?.clearValidators();
      this.state.loadUserDetail(this.userId);
      const sub = setInterval(() => {
        const u = this.state.selectedUser();
        if (u) {
          this.form.patchValue({ email: u.email, firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber ?? '', status: u.status, roleIds: u.roleIds });
          clearInterval(sub);
        }
      }, 100);
    } else {
      this.form.get('password')?.addValidators(Validators.required);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      email: v.email, firstName: v.firstName, lastName: v.lastName,
      phoneNumber: v.phoneNumber || undefined, status: v.status, roleIds: v.roleIds,
    };
    if (!this.isEdit && v.password) body['password'] = v.password;
    if (this.isEdit && this.userId) this.state.updateUser(this.userId, body);
    else this.state.createUser(body);
  }
}
