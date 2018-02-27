<template>
    <div 
        class="day" 
        v-bind:class="{ empty: dayNumber == 0, active: isSelectedDate }"
        @click="selectDay(dayNumber)"
    >
        {{ dayNumber == 0 ? "&nbsp;" : dayNumber }}
    </div>
</template>

<script>
    export default {
        props: ["dayNumber", "isSelectedDate"],
        methods: {
            selectDay(day) {
                this.$parent.$emit('selectDay', day);
            }
        }
    }
</script>
