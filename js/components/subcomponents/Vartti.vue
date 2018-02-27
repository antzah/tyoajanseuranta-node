<template>
    <div 
        class="quarterHour" 
        v-bind:class="{ painted }"
        @mouseover="shouldPaint"
        @click="quarterClicked(id)"
    >
    </div>
</template>

<script>
    export default {
        props: [
            "painted", 
            "isMouseDown", 
            "id", 
            "clicks"
        ],
        methods: {
            shouldPaint: function() {
                if (this.isMouseDown) this.painted = !this.painted;
            },
            quarterClicked(quarter) {
                this.$parent.$emit('quarterClicked', quarter);
            },
        },
        data: function() {
            return {
                "isPainted": this.painted
            }
        }
    }
</script>
