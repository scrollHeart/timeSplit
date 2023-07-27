<template>
  <div id="app">
    <time-period></time-period>
  </div>
</template>

<script>
import timePeriod from './views/timePeriodManage/index.vue'

export default {
  name: 'App',
  components: {
    timePeriod
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
