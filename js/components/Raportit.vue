<template>
    <div class="card">
        <div class="card-header">
            Raportit 
        </div>
        <div class="card-body">
            <p>Voit tarkastella tuntikertymää pidemmältä ajalta valitsemalla haluamasi ajanjakson.</p>
            <div class="row">
                <div class="col-lg-3 col-md-6 col-12">
                    <label>Valitse aloituspäivä</label>
                    <datepicker 
                        placeholder="Klikkaa aloituspäivää"
                        :monday-first="true"
                        :format="'d.M.yyyy'"
                        :language="'fi'"
                        @closed="validateSelectionsAndRunQuery(); openSecondPickerIfNecessary(); "
                        v-model="firstDate"
                    />
                    <label
                        v-if="firstDateIsBiggerThanSecond"
                        style="color: red"
                    >
                        Aloituspäivä ei voi olla myöhäisempi kuin lopetuspäivä.
                    </label>
                    <div class="small-spacer"></div>
                </div>
                <div class="col-lg-3 col-md-6 col-12">
                    <label>Valitse lopetuspäivä</label>
                    <datepicker 
                        placeholder="Klikkaa lopetuspäivää"
                        ref="endingDate"
                        :monday-first="true"
                        :format="'d.M.yyyy'"
                        :language="'fi'"
                        v-model="secondDate"
                        @closed="validateSelectionsAndRunQuery"  
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Datepicker from 'vuejs-datepicker';

export default {
    name: "raportit",
    components: {
        'datepicker': Datepicker,
    },
    methods: {
        openSecondPickerIfNecessary: function() {
            if (this.secondDate == "" || this.firstDate > this.secondDate) this.$refs.endingDate.showCalendar();
        },
        validateSelectionsAndRunQuery: function() {
            if (this.firstDate > this.secondDate && this.firstDate != "" && this.secondDate != "") this.firstDateIsBiggerThanSecond = true;
            else {
                this.firstDateIsBiggerThanSecond = false;

                if (this.firstDate != "" && this.secondDate != "") console.log("Query");
            }
        }
    },
    data: function() {
        return {
            firstDate: "",
            secondDate: "",
            firstDateIsBiggerThanSecond: false
        }
    }
}

</script>