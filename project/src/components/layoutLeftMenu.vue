<template>
  <div class="layout-left-menu">
    <a-menu
      :selectedKeys="selectKey"
      @menuItemClick="onClickMenuItem">
      <template
        v-for="item in menus"
        :key="item.path">
        <a-sub-menu
          v-if="item.children && item.children.length > 0"
          :title="item.title">
          <a-menu-item
            v-for="child in item.children"
            :key="child.path">
            <span>{{ child.title }}</span>
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item
          v-else
          :key="item.path">
          <span>{{ item.title }}</span>
        </a-menu-item>
      </template>
    </a-menu>
  </div>
</template>
<script>
  const menus = [
    { title: '首页', path: '/' },
    {
      title: '人员管理',
      children: [
        { title: '学生管理', path: '/users/student' },
        { title: '教师管理', path: '/users/teacher' },
      ],
    },
    { title: '院系管理', path: '/faculties' },
    { title: '专业管理', path: '/majors' },
    { title: '班级管理', path: '/classes' },
    {
      title: '课程管理',
      path: '/courses',
    },
    { title: '成绩管理', path: '/grades' },
    { title: '图书馆管理', path: '/library' },
  ]
</script>
<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  const router = useRouter()
  const selectKey = ref(router.currentRoute.value.path)
  // 监听路由变化以更新选中状态
  router.isReady().then(() => {
    selectKey.value = router.currentRoute.value.path
  })
  const onClickMenuItem = (e) => {
    selectKey.value = e
    router.push(e)
  }
</script>
<style>
  .layout-left-menu a {
    display: block;
  }
</style>
