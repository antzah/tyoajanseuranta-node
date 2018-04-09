<template>
    <div class="card raportit">
        <div class="card-header">
            Raportit 
            <span v-if="loading" style="font-size: 14px;color: #a9dbe5;">
                <img src="/img/loading.svg" style="height: 15px; margin-bottom: 2px;"> Ladataan..
            </span>
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
                    <div class="small-spacer"></div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <button 
                        @click="exportToExcel('csv')" 
                        :disabled="resultRows.length == 0"
                        class="btn btn-info btn-sm"
                    >
                        <i class="fas fa-file-excel"></i> Vie (.csv)
                    </button>
                    <button 
                        @click="exportToExcel('xlsx')" 
                        :disabled="resultRows.length == 0"
                        class="btn btn-info btn-sm"
                    >
                        <i class="fas fa-file-excel"></i> Vie (.xlsx)
                    </button>
                    <div class="small-spacer"></div>
                    <table id="raportti" class="table table-hover table-sm">
                        <thead>
                            <tr>
                                <td>Päivämäärä</td>
                                <td>Tunnit</td>
                                <td>Muistiinpanot</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="result in resultRows" 
                                :key="result._id"
                            >   
                                <th>{{ result.dayOfWeek }} {{ result.readableDate }}</th>
                                <td>{{ result.dailyTotal }}</td>
                                <td>{{ result.notes }}</td>
                            </tr>
                        </tbody>
                        <tfoot v-if="resultRows.length != 0">
                            <tr>
                                <td><strong>Yhteensä</strong></td>                                
                                <td><strong>{{ (periodTotal) ? periodTotal : null }}</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Datepicker from 'vuejs-datepicker';
import XLSX from 'xlsx';

export default {
    name: "raportit",
    components: {
        'datepicker': Datepicker,
    },
    data: function() {
        return {
            loading: false,
            userId: null,
            firstDate: "",
            secondDate: "",
            firstDateIsBiggerThanSecond: false,
            resultRows: [],
            periodTotal: 0,
            exportableResults: []
        }
    },
    created() {
        /**
         * Fetch the user ID so we can use that later
         */
        this.fetchUserAndSetDates();
    },
    methods: {
        exportToExcel: function(format) {
            let ws = XLSX.utils.json_to_sheet(this.exportableResults);
            let wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Raportti");
            let wbout = XLSX.write(wb, {bookType: format, type:'binary'});

            FileSaver.saveAs(new Blob([this.s2ab(wbout)], {
                type:"application/octet-stream"
            }), `tuntiraportti_${moment(this.firstDate).format("D.M.Y")}_${moment(this.secondDate).format("D.M.Y")}.${format}`);
        },
        s2ab: function(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        },
        openAPickerIfNecessary: function() {
            if (this.secondDate == "" || this.firstDate > this.secondDate) this.$refs.endingDate.showCalendar();
            if (this.firstDate == "" && this.secondDate != "") this.$refs.startDate.showCalendar();
        },
        validateSelectionsAndRunQuery: function() {
            if (this.firstDate > this.secondDate && this.firstDate != "" && this.secondDate != "") this.firstDateIsBiggerThanSecond = true;
            else {
                this.firstDateIsBiggerThanSecond = false;

                if (this.firstDate != "" && this.secondDate != "") {
                    this.loading = true;

                    axios.get("/reports", {
                        params: {
                            firstDate: this.firstDate,
                            secondDate: this.secondDate,
                            userId: this.userId
                        }
                    }).then(res => {
                        if (res.data) {
                            let resultTotal = 0;

                            this.exportableResults = [];
                            
                            res.data.map(resultRow => {
                                resultRow.dayOfWeek = moment(resultRow.day).format("ddd");
                                resultRow.trimmedDate = moment(resultRow.day).format("YYYY-MM-DD");
                                resultRow.readableDate = moment(resultRow.day).format("D.M.Y");
                                resultTotal += resultRow.dailyTotal;
                                this.exportableResults.push({
                                    "Päivämäärä": resultRow.trimmedDate,
                                    "Tunnit": resultRow.dailyTotal,
                                    "Muistiinpanot": resultRow.notes
                                });
                            });

                            this.periodTotal = resultTotal;
                            this.resultRows = res.data;
                            this.loading = false;
                        }
                    }).catch(err => {
                        console.log(err);
                        this.swalError("Virhe!", "Päivitä selainikkuna ja yritä hakea raportti uudelleen.")
                    });
                }
            }
        },
        fetchUserAndSetDates: function() {
            axios.get("/user")
                .then(res => {
                    this.userId = res.data._id;
                    this.firstDate = moment().date(1).toDate();
                    this.secondDate = moment().toDate();
                    this.validateSelectionsAndRunQuery();
                })
                .catch(err => {                    
                    this.swalError("Virhe!", "Jokin meni pieleen. Koita päivittää selainikkuna ja/tai kirjautua uudelleen sisään.")
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
    }
}

</script>