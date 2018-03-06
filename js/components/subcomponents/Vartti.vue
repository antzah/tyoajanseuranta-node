<template>
    <div 
        class="quarterHour" 
        v-bind:class="{ painted, hovered, deleting }"
        @mouseover="quarterHovered(id)"
        @click="quarterClicked(id)"
        @mouseleave="quarterExited(id)"
    >
    </div>
</template>

<script>
    export default {
        props: [
            "painted", 
            "hovered",
            "deleting",
            "id", 
            "clicks"
        ],
        methods: {
            quarterHovered(id) {
                this.$parent.$emit("quarterHovered", id);
            },
            quarterClicked(id) {
                this.$parent.$emit('quarterClicked', id);
            },
            quarterExited(id) {
                this.$parent.$emit('quarterExited', id);
            },
        },
        data: function() {
            return {
                "isPainted": this.painted
            }
        }
    }
</script>
