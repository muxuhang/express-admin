import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Home from '@/pages/Home' // 首页
import Login from '@/pages/Login' // 登录
import Users from '@/pages/Users' // 用户
import Faculties from '@/pages/Faculties'
import Student from '@/pages/Users/Student' // 用户
import Teacher from '@/pages/Users/Teacher' // 用户
import NotFound from '@/pages/NotFound' // 404

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/faculties',
    name: 'faculties',
    component: Faculties,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/users/:id',
    component: Users,
    children: [
      {
        path: 'student',
        name: 'Student',
        component: Student,
      },
      {
        path: 'teacher',
        name: 'Teacher',
        component: Teacher,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
