<template>
  <div class="not-found">
    <a-result status="404" subtitle="未找到页面">
      <template #extra>
        <a-space>
          <a-button type="primary" @click='backLastPage'>返回</a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>
<script setup>
import {useRouter} from 'vue-router'
const router = useRouter()
const backLastPage = ()=>{
  router.back()
}
</script>
<style>
.not-found{
  height:100vh;
}
</style>
