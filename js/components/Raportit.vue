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
                        ref="startDate"
                        :monday-first="true"
                        :format="'d.M.yyyy'"
                        :language="'fi'"
                        @closed="validateSelectionsAndRunQuery(); openAPickerIfNecessary(); "
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
                        @closed="validateSelectionsAndRunQuery(); openAPickerIfNecessary();"  
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
    created() {
        /**
         * Fetch the user ID so we can use that later
         */
        this.fetchUser();
    },
    methods: {
        openAPickerIfNecessary: function() {
            if (this.secondDate == "" || this.firstDate > this.secondDate) this.$refs.endingDate.showCalendar();
            if (this.firstDate == "" && this.secondDate != "") this.$refs.startDate.showCalendar();
        },
        validateSelectionsAndRunQuery: function() {
            if (this.firstDate > this.secondDate && this.firstDate != "" && this.secondDate != "") this.firstDateIsBiggerThanSecond = true;
            else {
                this.firstDateIsBiggerThanSecond = false;

                if (this.firstDate != "" && this.secondDate != "") {
                    axios.get("/reports", {
                        params: {
                            firstDate: this.firstDate,
                            secondDate: this.secondDate,
                            userId: this.userId
                        }
                    }).then(res => {
                        if (res.data) {
                            console.log(res.data);
                        }
                    }).catch(err => {
                        console.log(err);
                        this.swalError("Virhe!", "Päivitä selainikkuna ja yritä hakea raportti uudelleen.")
                    });
                }
            }
        },
        fetchUser: function() {
            axios.get("/user")
                .then(res => {
                    this.userId = res.data._id;
                })
                .catch(err => {                    
                    this.swalError("Virhe!", "Jokin meni pieleen. Koita päivittää selainikkuna ja kirjautua uudelleen sisään.")
                });
        },
        swalSuccess: function(title, text) {
            swal({
                position: 'bottom-end',
                type: 'success',
                title: title,
                text: text,
                showConfirmButton: false,
                backdrop: false,
                width: "280px",
                padding: "12px",
                timer: 1500
            })
        },
        swalError: function(title, text) {
            swal({
                position: 'bottom-end',
                type: 'error',
                title: title,
                text: text,
                showConfirmButton: false,
                backdrop: false,
                width: "280px",
                padding: "12px 12px 24px",
                timer: 3000
            })
        }
    },
    data: function() {
        return {
            userId: null,
            firstDate: "",
            secondDate: "",
            firstDateIsBiggerThanSecond: false
        }
    }
}

</script>