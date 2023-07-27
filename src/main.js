import Vue from 'vue'
import App from './App.vue'
import Moment from 'moment'
import { Button, ButtonGroup, Message, Dialog, Tooltip } from 'element-ui';
Vue.use(Button)
Vue.use(ButtonGroup)
Vue.use(Tooltip)
Vue.use(Dialog)
Vue.config.productionTip = false
Vue.prototype.$moment = Moment;
Vue.prototype.$message = Message;
new Vue({
  render: h => h(App),
}).$mount('#app')
