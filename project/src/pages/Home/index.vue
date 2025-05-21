<template>
  <div class="home-page">
    <page-header
      title="首页"
      subtitle="控制面板" />
    <page-container>
      <div class="statistics mt-6 text-lg leading-7 space-y-2 flex justify-between">
        <div class="flex-1">
          <div>年级</div>
          <h2>{{ gradeCount }}</h2>
        </div>
        <div class="font-semibold text-gray-700">班级: {{ classCount }}</div>
        <div class="font-semibold text-gray-700">老师: {{ teacherCount }}</div>
        <div class="font-semibold text-gray-700">学生: {{ studentCount }}</div>
      </div>
    </page-container>
  </div>
</template>
<script setup>
  import PageHeader from '@/components/PageHeader'
  import PageContainer from '../../components/PageContainer.vue'

  // 模拟数据
  const studentCount = 1200
  const teacherCount = 80
  const classCount = 30
  const gradeCount = 6
</script>
