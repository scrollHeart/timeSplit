<template>
    <div
        class="content time-period-content"
    >
        <!-- 主体 -->
        <main
            ref="table"
            class="body"
            :style="{'padding-top': '51px'}"
        >
            <aside class="body-bg" :style="{width: wrapWidth}"></aside>
            <el-tooltip
                v-for="(i, index) in timeList"
                :key="index" popper-class="time-period-tooltip"
                class="item" effect="dark"
                placement="top"
            >
                <div
                    class="main"
                    :style="{
                        width: widthList[index] + 'px',
                    }"
                >
                    <span v-show="mode === 'edit'">
                        <em>
                            <b
                                :style="{opacity: timeList.length === 1 ? '.5' : '1',
                                         cursor: timeList.length === 1 ? 'not-allowed' : 'pointer'}"
                                @click="deleteHandler(index)"
                            >删除</b>
                            <b
                                :style="{opacity: (notSplit(i) || timeList.length >= maxSplitNum) ? '.5' : '1',
                                         cursor: (notSplit(i) || timeList.length >= maxSplitNum)
                                             ? 'not-allowed' : 'pointer'}"
                                @click="splitHandler(i, index)"
                            >拆分</b>
                        </em>
                        <i></i>
                    </span>
                </div>
            </el-tooltip>
        </main>
        <!-- 刻度 -->
        <aside class="scale">
            <b
                v-for="(i, index) in scaleList"
                :key="index"
                :style="{left: calcPosition(i, index) + 'px'}"
            >
                {{ i }}
            </b>
        </aside>
        <!-- 手柄拖拽 -->
        <aside v-if="mode === 'edit'" class="handle">
            <span
                v-for="(i, index) in scaleList"
                :key="index"
                :class="{
                    active: activeHandlerIndex === index && effectiveMove,
                    'no-dragging': noDragging,
                }"
                :style="{left: calcPosition(i, index) + 'px'}"
                @mousedown="downHandler(index)"
                @mouseup="cancelHandler"
            >
                <i class="icon-pause"></i>
                <em v-show="activeHandlerIndex === index && effectiveMove">{{ i }}</em>
            </span>
        </aside>
        <!-- 遮罩 -->
        <aside
            v-show="maskIsShow && mode === 'edit'"
            class="mask"
            @mousemove="moveHandler"
            @mouseup="cancelHandler"
        >

        </aside>
    </div>
</template>
<script>
export default {
    props: {
        // 时段列表
        originTimeList: {
            type: Array,
            default: () => [],
        },
        // 模式 默认-default（仅展示）编辑-edit（可通过交互编辑时段)
        mode: {
            type: String,
            default: 'default',
        },
        // 最大拆分时段表数量
        maxSplitNum: {
            type: Number,
            default: 10,
        },
        // 最小宽度
        miniLength: {
            type: Number,
            default: 30,
        },
        // 最大可选时间
        maxTime: {
            type: String,
            default: '24:00',
        },
        // 最小拖拽时间颗粒度和最小拆分颗粒度
        minUnitTime: {
            type: Number,
            default: 15,
        },
        noDragging: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            wrapWidth: 'calc(100% - 28px)',
            timeList: [],
            // 单位时间（秒）对应的长度（像素）
            PTR: undefined,
            // 刻度表
            scaleList: [],
            // 一天的秒值
            DAY_SECOND: 24 * 60 * 60,
            // 移动的初始位置
            initPosition: undefined,
            activeHandlerValue: undefined,
            // 遮罩状态
            maskIsShow: false,
            // 处于活动状态的操作按钮对应的索引
            activeHandlerIndex: -1,
            // 时刻表各时段宽度数组
            widthList: [],
            // 是否有效移动
            effectiveMove: false,
        };
    },
    methods: {
        deleteHandler(index) {
            if (this.timeList.length === 1) {
                return;
            }
            if (index === (this.timeList.length - 1)) {
                this.timeList.splice(index, 1);
                this.timeList[index - 1].end_time = '24:00';
                this.scaleList.splice(index, 1);
            }
            else if (index === 0) {
                this.timeList.splice(index, 1);
                this.timeList[index].start_time = '00:00';
                this.scaleList.splice(1, 1);
            }
            else {
                this.timeList.splice(index, 1);
                this.timeList[index].start_time = this.timeList[index - 1].end_time;
                this.scaleList.splice(index, 1);
            }
            this.getPTR();
        },
        // 是否不可拆分
        notSplit(i) {
            return (this.$moment(i.end_time, 'HH:mm')
                - this.$moment(i.start_time, 'HH:mm')) < this.minUnitTime * 2 * 60 * 1000;
        },
        // 拆分时段
        splitHandler(i, index) {
            if (this.notSplit(i) || this.timeList.length >= 10) {
                return;
            }
            let diff = this.$moment(i.end_time, 'HH:mm') - this.$moment(i.start_time, 'HH:mm');
            let diffMinute = diff / 1000 / 60;
            let half = diffMinute / 2;
            let remainder = half % this.minUnitTime;
            let left = half + remainder;
            let newTimePoint = this.$moment(i.start_time, 'HH:mm').add(left, 'minutes').format('HH:mm');
            let newTime = JSON.parse(JSON.stringify(this.timeList[index]));
            newTime.start_time = newTimePoint;
            this.timeList.splice(index + 1, 0, newTime);
            this.timeList[index].end_time = newTimePoint;
            this.scaleList.splice(index + 1, 0, newTimePoint);
            this.getPTR();
        },
        // 编辑时开始拖动
        downHandler(index) {
            if (this.noDragging) {
                return;
            }
            this.effectiveMove = true;
            this.activeHandlerIndex = index;
            this.activeHandlerValue = this.scaleList[index];
            this.activeHandlerValue = this.scaleList[index];
            this.maskIsShow = true;
        },
        // 编辑时拖动结束
        cancelHandler() {
            if (this.maskIsShow === false) {
                return;
            }
            this.effectiveMove = false;
            this.activeHandlerIndex = -1;
            this.initPosition = undefined;
            this.activeHandlerValue = undefined;
            this.maskIsShow = false;
        },
        // 编辑时拖动
        moveHandler(e) {
            if (!this.effectiveMove) {
                return;
            }
            if (!this.initPosition) {
                this.initPosition = e.x;
                return;
            }
            // 确定增加了还是减少了
            let method = e.x - this.initPosition > 0 ? 'add' : 'subtract';
            // 确定移动距离对应的时间（秒）
            let second = parseInt(Math.abs(e.x - this.initPosition) / this.PTR, 10);
            // 得到当前时间点的时间
            let time = this.$moment(this.activeHandlerValue, 'HH:mm')[method](second, 'seconds');
            // 时间范围不能超出当天
            if (time.format('DD') !== this.$moment().format('DD')) {
                return;
            }
            if (this.maxTime && time > this.$moment(this.maxTime, 'HH:mm')) {
                return;
            }
            time = time.format('HH:mm');
            // 计算是否超过范围超过则设置为边界值
            let checkResult = this.isLawful(this.scaleList[this.activeHandlerIndex - 1],
                                            time, this.scaleList[this.activeHandlerIndex + 1]);
            if (checkResult !== true) {
                this.setValue(checkResult);
                return;
            }
            // 计算是否超过范围超过则设置为边界值
            this.setValue(time);

        },
        // 时间规则化（消除类似12:60时间的显示）
        standardTime(time) {
            let left = +time.split(':')[0];
            let right = +time.split(':')[1];
            if (right === 60) {
                return String(left + 1).padStart(2, 0) + ':00';
            }
            return time;
        },
        // 设置合法值
        setValue(value) {
            let minute = +value.split(':')[1];
            let newValue = `${value.split(':')[0]}:${String(Math.round(minute / this.minUnitTime)
                * this.minUnitTime).padStart(2, 0)}`;

            this.scaleList.splice(this.activeHandlerIndex, 1, this.standardTime(newValue));
            this.timeList[this.activeHandlerIndex].start_time = newValue;
            this.timeList[this.activeHandlerIndex - 1].end_time = newValue;
        },
        /**
         * @description: 校验时间是否合法
         * @param prev { String } 上一个值
         * @param current { String } 当前待校验值
         * @param next { String } 下一个值
         * @return 合法时返true 否则返回边界时间值 { Boolean String }
         */
        isLawful(prev, current, next) {
            let current_moment = this.$moment(current, 'HH:mm');
            let prev_moment = this.$moment(prev, 'HH:mm').add(this.minUnitTime, 'minutes');
            if (current_moment.isBefore(prev_moment)) {
                return prev_moment.format('HH:mm');
            }
            let next_moment = this.$moment(next, 'HH:mm').subtract(this.minUnitTime, 'minutes');
            if (current_moment.isAfter(next_moment)) {
                return next_moment.format('HH:mm');
            }
            return true;
        },
        // 时段转换为图形宽度
        calcWidth(period, timeListIndex) {
            let second = (this.$moment(period.end_time, 'HH:mm') - this.$moment(period.start_time, 'HH:mm')) / 1000;
            if (this.mode === 'default' || this.mode === 'edit') {
                if (this.PTR * second < this.miniLength) {
                    return this.miniLength;
                }
            }
            return this.PTR * second;
        },
        // 计算PTR(每秒对应的像素值)
        getPTR(list) {
            let isFunction = true;
            if (!list) {
                list = this.timeList;
                isFunction = false;
            }
            let width = this.availableWidth() - 2 * (list.length - 1);
            // 如果全部设置为最小值（this.miniLength）仍不能满足长度则将PTR设置为0
            if (list.length * this.miniLength > width) {
                if (!isFunction) {
                    this.PTR = 0;
                    return;
                }
            }
            let PTR = width / this.DAY_SECOND;
            if (this.mode === 'default') {
                let miniLength = this.miniLength; // 最小宽度
                let miniTime = miniLength / PTR;
                let miniSection = [];
                list.forEach(i => {
                    let time = (this.$moment(i.end_time, 'HH:mm') - this.$moment(i.start_time, 'HH:mm')) / 1000;
                    if (time < miniTime) {
                        miniSection.push(time);
                    }
                });
                if (miniSection.length) {
                    width = width - (this.miniLength * miniSection.length);
                    let second = this.DAY_SECOND - miniSection.reduce((all, i) => {
                        all += i;
                        return all;
                    }, 0);
                    if (isFunction) {
                        return width / second;
                    }
                    this.PTR = width / second;
                    return;
                }
            }
            if (isFunction) {
                return false;
            }
            this.PTR = PTR;
        },
        // 时段表可用宽度
        availableWidth() {
            return parseFloat(getComputedStyle(this.$refs.table).width);
        },
        calcPosition(time, index) {
            if (this.mode === 'default' || this.mode === 'edit') {
                let position = 18 + index * 2 - 2;
                this.timeList.some((i, timeIndex) => {
                    if (timeIndex < index) {
                        // position += this.calcWidth(i);
                        position += this.widthList[timeIndex];
                    }
                });
                return position;
            }
            let second = (this.$moment(time, 'HH:mm') - this.$moment('00:00', 'HH:mm')) / 1000;
            return this.PTR * second + 18 + index * 2;
        },
        init(times) {
            if (this.mode === 'default') {
                let PTR = this.getPTR(times);
                if (PTR) {
                    times.forEach(i => {
                        let period = i;
                        let second = (this.$moment(period.end_time, 'HH:mm')
                            - this.$moment(period.start_time, 'HH:mm')) / 1000;
                        if (PTR * second < this.miniLength) {
                            i.isMini = true;
                        }
                    });
                }
                this.timeList = times;
            }
            else {
                this.timeList = times;
            }
            // 计算刻度
            let list = new Set();
            this.timeList.forEach(i => {
                list.add(i.start_time);
                list.add(i.end_time);
            });
            this.getPTR();
            this.scaleList = Array.from(list);
            this.scaleList.forEach((i, index) => {
                if (i.includes('60')) {
                    this.scaleList[index] = this.standardTime(i);
                }
            });
        },
    },
    mounted() {
        this.init(this.originTimeList);
    },
    watch: {
        originTimeList: {
            immediate: false,
            deep: true,
            handler(newVal, oldVal) {
                this.init(newVal);
            },
        },
        timeList: {
            immediate: false,
            deep: true,
            handler(newVal, oldVal) {
                let list = [];
                let obj = {};
                newVal.forEach((item, index) => {
                    let period = item;
                    period.start_time = this.standardTime(period.start_time);
                    period.end_time = this.standardTime(period.end_time);
                    let second = (this.$moment(period.end_time, 'HH:mm')
                        - this.$moment(period.start_time, 'HH:mm')) / 1000;
                    obj[index] = {'second': second};
                    if (this.PTR * second < this.miniLength) {
                        obj[index].widthGap = this.miniLength - this.PTR * second;
                        obj[index].width = this.miniLength;
                    }
                    else {
                        obj[index].width = this.PTR * second;
                    }
                });
                // 初始化有宽度差的时段索引
                const _this = this;
                let i = 0; // 遍历当前时段索引
                let s = 0; // 取最小宽度的时段索引
                let n = 0; // 向后查找时段索引，处理宽度差额
                let p = 0; // 向前查找时段索引，处理宽度差额

                // 向前一时段找回宽度差，若前一时段宽度也小于最小宽度，则继续向前找
                const findPrevWidthCapFn = function (p) {
                    if (p >= 0) {
                        if (!obj[p].widthGap) {
                            if (obj[p].width >= obj[s].widthGap + _this.miniLength) {
                                obj[p].width = obj[p].width - obj[s].widthGap;
                            }
                            else {
                                if (p > 0) {
                                    // 向前一时段找回宽度差
                                    p--;
                                    // 继续向前找
                                    findPrevWidthCapFn(p);
                                }
                            }
                        }
                        else {
                            if (p > 0) {
                                // 向前一时段找回宽度差
                                p--;
                                // 继续向前找
                                findPrevWidthCapFn(p);
                            }
                        }
                    }
                };
                // 向后一时段找回宽度差，若后一时段宽度也小于最小宽度，则继续向后找
                const findWidthGapFn = function (n) {
                    if (n <= newVal.length - 1) {
                        if (!obj[n].widthGap) {
                            if (obj[n].width >= obj[s].widthGap + _this.miniLength) {
                                obj[n].width = obj[n].width - obj[s].widthGap;
                            }
                            else {
                                if (n >= newVal.length - 1) {
                                    // 最后一个时段，仍无法处理宽度差额，向最小宽度的时段索引前找
                                    p = s - 1;
                                    // 向前一时段找回宽度差，若前一时段宽度也小于最小宽度，则继续向前找
                                    findPrevWidthCapFn(p);
                                }
                                else {
                                    // 向后一时段找回宽度差
                                    n++;
                                    // 继续向后找
                                    findWidthGapFn(n);
                                }
                            }
                        }
                        else {
                            if (n >= newVal.length - 1) {
                                // 最后一个时段，仍无法处理宽度差额，向最小宽度的时段索引前找
                                p = s - 1;
                                findPrevWidthCapFn(p);
                            }
                            else {
                                // 向后一时段找回宽度差
                                n++;
                                // 继续向后找
                                findWidthGapFn(n);

                            }
                        }
                    }
                };

                const testFn = function (i) {
                    // 设置当前时段宽度
                    if (obj[i].widthGap) {
                        s = i;
                        if (i >= newVal.length - 1) {
                            // 最后一个时段，向前找
                            p = i - 1;
                            // 向前一时段找回宽度差，若前一时段宽度也小于最小宽度，则继续向前找
                            findPrevWidthCapFn(p);
                        }
                        else {
                            n = i + 1;
                            // 继续向后找
                            findWidthGapFn(n);
                        }
                    }
                };
                for (let i = 0; i < newVal.length; i++) {
                    testFn(i);
                }
                for (let key in obj) {
                    if (obj[key].width) {
                        list.push(obj[key].width);
                    }
                    else {
                        list.push(obj[key].second * this.PTR);
                    }
                }
                this.widthList = list;
            },
        },
    },
};
</script>
<style lang="less">
    .el-tooltip__popper.is-dark.time-period-tooltip {
        display: none;
    }
</style>
<style lang="less" scoped src="@/styles/timePeriod.less">
</style>