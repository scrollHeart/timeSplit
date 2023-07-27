<template>
    <div class="time-period-config-wrap">
        <div class="workday-time-period time-period-selection">
            <h3 style="textAlign: right;">
                <div v-if="workdayState === 'default'">
                    <div
                        class="btn-edit-container"
                    >
                        <span
                            class="btn-box btn-default"
                            @click="editHandle('workdayState')"
                        >编辑</span>
                    </div>
                </div>
                <div v-else>
                    <span class="btn-box btn-default" @click="saveHandle('workdayState')">保存</span>
                </div>
            </h3>
            <time-period
                :mode="workdayState"
                :origin-time-list="workdayTimeList"
            />
        </div>
    </div>
</template>
<script>
import TimePeriod from './components/newTimePeriod.vue';

export default {
    components: {
        TimePeriod,
    },
    data() {
        return {
            workdayState: 'default',
            holidayState: 'default',
            workdayTimeList: [
                {
                    end_time: "07:00",
                    start_time: "00:00",
                },
                {
                    end_time: "09:00",
                    start_time: "07:00",
                },
                {
                    end_time: "17:00",
                    start_time: "09:00",
                },
                {
                    end_time: "24:00",
                    start_time: "17:00",
                },
            ],
        };
    },
    methods: {
        editHandle(type) {
            this[type] = 'edit';
        },
        saveHandle(type) {
            this[type] = 'default';
        },
    },
};
</script>
<style lang="less" scoped src="@/styles/timePeriod.less">
</style>
<style lang="less">
.time-config-tooltip.is-dark {
    background: #2e3235;
}
.disabled-edit-tooltip.is-dark {
    background: rgba(4, 8, 13, .8);
}
.disabled-edit-tooltip {
    display: block;
}
.disabled-edit-tooltip.is-hidden-workday,
.disabled-edit-tooltip.is-hidden-holiday {
    display: none;
}
</style>
