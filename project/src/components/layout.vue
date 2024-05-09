<template>
  <a-layout class="layout-box">
    <a-layout-sider
      theme="dark"
      breakpoint="lg"
      :width="220">
      <div class="logo"></div>
      <layout-left-menu />
    </a-layout-sider>
    <a-layout>
      <a-layout-header>
        <!-- <layout-header-menu></layout-header-menu> -->
      </a-layout-header>
      <a-layout>
        <a-layout-content>
          <slot></slot>
        </a-layout-content>
        <a-layout-footer></a-layout-footer>
      </a-layout>
    </a-layout>
  </a-layout>
</template>
<script setup>
  import layoutLeftMenu from './layoutLeftMenu.vue'
  // import layoutHeaderMenu from './layoutHeaderMenu.vue'
</script>
<style>
  .layout-box {
    height: 100vh;
  }
  .layout-box .logo {
    height: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    margin: 10px;
  }
</style>
