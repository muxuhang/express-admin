<template>
  <div class="layout-left-menu">
    <a-menu
      :selectedKeys="[selectKey]"
      :defaultOpenKeys="[openKey]"
      @menuItemClick="onClickMenuItem"
      @onCollapseChange="onCollapseChange">
      <template v-for="(item, index) in menus">
        <a-sub-menu
          :key="index"
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
      path: '/user',
      children: [
        { title: '学生管理', path: '/users/student' },
        { title: '教师管理', path: '/users/teacher' },
      ],
    },
    { title: '院系管理', path: '/faculties' },
    { title: '专业管理', path: '/majors' },
    { title: '班级管理', path: '/classes' },
    { title: '课程管理', path: '/courses' },
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
  const onCollapseChange = (e) => {
    console.log(e)
  }
</script>
<style>
  .layout-left-menu a {
    display: block;
  }
  .arco-menu-dark .arco-menu-inline-header.arco-menu-selected,
  .arco-menu-dark .arco-menu-inline-header.arco-menu-selected .arco-icon,
  .arco-menu-dark .arco-menu-inline-header.arco-menu-selected .arco-menu-icon {
    color: #fff;
  }
</style>
