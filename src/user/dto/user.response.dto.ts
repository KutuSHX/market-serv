import { User } from '@prisma/client'

export class UserResponseDto {
  id: number
  email: string
  username: string
  password: string
  role: string
  createdAt: Date
  updatedAt?: Date

  constructor(user: User) {
    this.id = user.id
    this.email = user.email
    this.username = user.username
    this.password = user.password
    this.role = user.role
    this.createdAt = user.createdAt
    this.updatedAt = user.updatedAt
  }
}
