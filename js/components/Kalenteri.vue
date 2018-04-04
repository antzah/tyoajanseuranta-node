<style>
@media (min-width: 768px) {
    .muistiinpanot { 
        display: block !important; 
    }
}

.dg-content-body {
  border-bottom: 0;
}

.dg-main-content {
  width: 95%;
  border-radius: 2px;
}

.dg-btn {
    border-radius: 1px;
}

.card {
    margin-bottom: 16px;
}

hr {
    border-top: 1px solid rgba(204, 204, 204, 0.32);
}

.dg-btn--ok {
    color: #ffffff;
    background-color: #4CAF50;
    border-color: #4CAF50;
}

.dg-btn-loader .dg-circle {
    width: .6em;
    height: .6em;
    background-color: #ffffff;
}
</style>

<template>
    <div class="card">
        <div class="card-header">
            Kalenteri 
            <span v-if="loading" style="font-size: 14px;color: #a9dbe5;">
                <img src="/img/loading.svg" style="height: 15px;margin-bottom: 2px;"> Ladataan..
            </span>
        </div>
        <div class="card-body">
            <div class="row calendar-wrapper">
                <div class="col-lg-4 col-xl-3 col-md-6 col-12">
                    <div class="calendar" v-show="showCalendarOnMobile">
                        <div class="month title">
                            <button @click="minusMonth" class="btn float-left"><i class="fas fa-caret-left"></i></button> 
                            {{ selectedDate.format("MMMM YYYY") }}
                            <button @click="plusMonth" class="btn  float-right"><i class="fas fa-caret-right"></i></button> 
                        </div>
                        <div class="days">
                            <div class="row">
                                <div class="col-12">
                                    <div class="weekdays">
                                        <div class="day-of-the-week">MA</div>
                                        <div class="day-of-the-week">TI</div>
                                        <div class="day-of-the-week">KE</div>
                                        <div class="day-of-the-week">TO</div>
                                        <div class="day-of-the-week">PE</div>
                                        <div class="day-of-the-week">LA</div>
                                        <div class="day-of-the-week">SU</div>
                                    </div>
                                    <paiva 
                                        v-for="n in emptyDaysBeforeStart" 
                                        :key="n" 
                                        day-number=0
                                    />
                                    <paiva 
                                        v-for="n in daysInSelectedMonth" 
                                        :key="n+100" 
                                        :day-number="n"
                                        :is-selected-date="n == selectedDay"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-9 col-lg-8 col-md-6 col-12 selectedDayContainer">
                    <div class="row">
                        <div class="col-12 d-md-none">
                            <button 
                                class="btn btn-warning btn-sm "
                                @click="showCalendarOnMobile = !showCalendarOnMobile"
                            >
                                {{ showCalendarOnMobile ? "Piilota" : "Näytä" }} kalenteri
                            </button>
                            <div class="small-spacer"></div>
                        </div>
                        <div class="col-lg-6 col-12">
                            <button @click="minusDay" type="button" class="btn btn-outline-info btn-sm">Edellinen päivä</button>
                            <button @click="plusDay" type="button" class="btn btn-outline-info btn-sm">Seuraava päivä</button>
                            <div class="small-spacer"></div>
                            <h3 v-if="!loading">{{ selectedDate.format("dddd") }} {{ selectedDate.format("D.M.YYYY") }}</h3>
                            <h3 v-if="loading" style="color: #adadad">{{ selectedDate.format("dddd") }} {{ selectedDate.format("D.M.YYYY") }}</h3>
                            <h4 id="dailyTotal">{{ dailyTotal }}</h4>
                        </div>
                        <div class="col-lg-6 col-12">
                            <hr class="d-block d-xs-none d-sm-block d-md-block d-lg-none">
                            <div class="row">
                                <div class="d-none d-md-block col-md-12">
                                    <h5 style="margin-bottom: 0">Päivän muistiinpanot</h5>
                                </div>
                                <div class="d-block d-md-none col-12">
                                    <button 
                                        class="btn btn-warning btn-sm d-md-none"
                                        @click="showNotesOnMobile = !showNotesOnMobile"
                                        style="margin-bottom: 0;"
                                    >
                                        {{ showNotesOnMobile ? "Piilota" : "Näytä" }} päivän muistiinpanot
                                    </button>
                                </div>
                            </div>
                            <div class="muistiinpanot" v-show="showNotesOnMobile">
                                <div class="small-spacer"></div>
                                <p class="small-text">Voit kirjata alle halutessasi esim. ranskalaisin viivoin päivän työtehtäviä.</p>
                                <textarea 
                                    placeholder='Syötä muistiinpanot'
                                    name="muistiinpanot" 
                                    rows="4" 
                                    class="form-control notes-textarea"
                                    v-model="notes"
                                >
                                </textarea>
                                <div class="small-spacer"></div>
                                <button 
                                    @click="saveNotes" 
                                    class="btn btn-info btn-sm"
                                >
                                    Tallenna
                                </button>
                                <div class="small-spacer"></div>
                            </div>
                            <hr class="d-block d-xs-none d-sm-block d-md-none">
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="row">
                        <div class="col-12">
                            <div class="hourIndicator" :key="n" v-for="n in 24">
                                {{ leftPad(n-1, 2, 0) }}
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 quarters" v-bind:class="{clicked: this.clicks == 1}">
                            <span class="disabled-overlay" v-if="loading"></span>
                            <vartti 
                                v-for="quarter in quarters" 
                                :key="quarter.qId"
                                :clicks="clicks"
                                :painted="quarter.painted"
                                :hovered="(quarter.hovered) ? quarter.hovered : false"
                                :deleting="(quarter.deleting) ? quarter.deleting : false"
                                :id="quarter.qId"
                                v-tooltip="getTimeAndEnding(quarter.qId)"
                            />
                        </div>
                    </div>
                    <div class="small-spacer"></div>
                    <div class="d-block d-sm-block d-md-none">
                        <div class="row">
                            <div class="col-12">
                                <hr>
                                <h5>Lisää tai poista työjakso</h5>
                            </div>
                            <div class="col-6" style="padding-right: 5px">
                                <label>Alku</label>
                                <select 
                                    class="form-control"
                                    v-model="selectedStartTime"
                                >
                                    <option 
                                        v-for="n in 96"
                                        :value="n-1"
                                        :key="n-1"
                                    >
                                        {{ getStartTime(n-1) }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-6" style="padding-left: 5px">
                                <label>Loppu</label>
                                <select 
                                    class="form-control"
                                    v-model="selectedEndTime"
                                >
                                    <option 
                                        v-for="n in 96"
                                        :value="n-1"
                                        :key="n-1"
                                    >
                                        {{ getEndTime(n-1) }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-8" style="padding-right: 0">
                                <button 
                                    style="margin-top: 12px; width: 100%" 
                                    class="btn btn-success"
                                    @click="addPeriod"
                                >
                                    Lisää
                                </button>
                            </div>
                            <div class="col-4">
                                <button 
                                    style="margin-top: 12px; width: 100%" 
                                    class="btn btn-danger"
                                    @click="removePeriod"
                                >
                                    Poista
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="d-none d-md-block">         
                        <p v-if="clicks == 0 && !deleting">Lisää pätkä klikkaamalla aloitus- ja lopetusaikaa.</p>
                        <p v-if="clicks == 1 && !deleting">Valitse vielä lopetusaika.</p>
                        <p v-if="deleting && clicks == 0" style="color: red">Valitse poistettavan pätkän alku.</p>
                        <p v-if="deleting && clicks == 1" style="color: red">Valitse poistettavan pätkän loppu.</p>
                        <button v-if="!deleting && clicks == 0" class="btn btn-danger btn-sm" @click="deleting = true">Poista</button>
                        <button disabled="disabled" v-if="!deleting && clicks == 1" class="btn btn-danger btn-sm" @click="deleting = true">Poista</button>
                        <button v-if="deleting" class="btn btn-secondary btn-sm" @click="deleting = false">Peruuta poistaminen</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import leftPad from "left-pad";
import päivä from "./subcomponents/päivä";
import vartti from "./subcomponents/vartti";

function emptyDaysBeforeStart(month, year) {
    var day = moment(new Date(year, month, 1));
    var weekday = day.isoWeekday();
    return weekday - 1;
}

function returnSmallerAndBiggerId(firstId, secondId) {   
    var smallerId = (firstId < secondId) ? firstId : secondId;
    var biggerId = (secondId > firstId) ? secondId : firstId; 

    return [smallerId, biggerId];
}

var quarters = [];

for (var i = 0; i < 96; i++) {
    quarters.push({
        "qId": i,
        "painted": false
    })
}

export default {
    name: "kalenteri",
    components: {
        'paiva': päivä,
        'vartti': vartti
    },
    data: function() {
        return {
            "userId": null,
            "currentDate": moment().hour(12).minute(0).seconds(0),
            "selectedDate": moment().hour(12).minute(0).seconds(0),
            "selectedDay": moment().get("date"),
            "selectedMonth": moment().get("month"),
            "selectedYear": moment().get("year"),
            "daysInSelectedMonth": moment().daysInMonth(),    
            "emptyDaysBeforeStart": emptyDaysBeforeStart(moment().get("month"), moment().get("year")),
            "clicks": 0,
            "firstClickedQuarter": 0,
            "secondClickedQuarter": 0,
            "quarters": quarters,
            "deleting": false,
            "loading": false,
            "notes": "",
            "dailyTotal": "..",
            "dailyTotalAsDecimal": 0,
            showCalendarOnMobile: false,
            showNotesOnMobile: false,
            selectedStartTime: 0,
            selectedEndTime: 0
        }
    },
    methods: {
        addPeriod: function() {
            let sortedQuarters = returnSmallerAndBiggerId(this.selectedStartTime, this.selectedEndTime);
            let smallerId = sortedQuarters[0], biggerId = sortedQuarters[1];

            this.$dialog.confirm(`Haluatko varmasti lisätä työjakson välille ${this.getStartTime(smallerId)}–${this.getEndTime(biggerId)}?`, {
                loader: true,
                cancelText: "Peruuta",
                okText: "Vahvista"
            })
            .then((dialog) => {

                this.loading = true;

                for (var i = smallerId; i <= biggerId; i++) {
                    this.quarters[i].painted = true;
                }

                this.updateDailyTotal();

                axios.post("/days", {
                    quarters: this.quarters,
                    day: this.selectedDate,
                    dailyTotal: this.dailyTotalAsDecimal,
                    notes: this.notes
                })
                .then(res => {
                    this.loading = false;
                    this.swalSuccess("Tallennettu");
                })
                .catch(err => {
                    this.swalError("Virhe!", "Tiedot eivät tallentuneet. Yritä uudelleen tai päivitä selainikkuna.");
                    this.loading = false;
                });

                this.loading = false;
                dialog.close();
            })
            .catch(() => {
                console.log('Delete aborted');
            });
        },
        removePeriod: function() {
            let sortedQuarters = returnSmallerAndBiggerId(this.selectedStartTime, this.selectedEndTime);
            let smallerId = sortedQuarters[0], biggerId = sortedQuarters[1];

            this.$dialog.confirm(`Haluatko varmasti poistaa jakson ${this.getStartTime(smallerId)}–${this.getEndTime(biggerId)} merkinnät?`, {
                loader: true,
                cancelText: "Peruuta",
                okText: "Vahvista"
            })
            .then((dialog) => {

                this.loading = true;

                for (var i = smallerId; i <= biggerId; i++) {
                    this.quarters[i].painted = false;
                }

                this.updateDailyTotal();

                axios.post("/days", {
                    quarters: this.quarters,
                    day: this.selectedDate,
                    dailyTotal: this.dailyTotalAsDecimal,
                    notes: this.notes
                })
                .then(res => {
                    this.loading = false;
                    this.swalSuccess("Tallennettu");
                })
                .catch(err => {
                    this.swalError("Virhe!", "Tiedot eivät tallentuneet. Yritä uudelleen tai päivitä selainikkuna.");
                    this.loading = false;
                });

                this.loading = false;
                dialog.close();
            })
            .catch(() => {
                console.log('Delete aborted');
            });
        },
        /**
         * https://stackoverflow.com/questions/33769178/moment-js-decimals-into-time-format
         */
        decimalHoursToString: function(hours) {
            return ('' + Math.floor(hours) % 24).slice(-2) + 'h ' + ((hours % 1)*60 + '0').slice(0, 2) + "min";
        },
        updateDailyTotal: function() {
            var dailyTotalAsDecimal = 0;
            this.quarters.map(quarter => (quarter.painted) ? dailyTotalAsDecimal += 0.25 : null);
            this.dailyTotalAsDecimal = dailyTotalAsDecimal;
            this.dailyTotal = this.decimalHoursToString(dailyTotalAsDecimal);
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
        fetchDay: function(selectedDate) {
            /**
             * selectedDate is an instance of moment, so 
             * we can convert it to a readable UTC format
             * with .format()
             */
            selectedDate = selectedDate.format();
            this.loading = true;

            axios.get("/days", {
                params: { selectedDate }
            }).then(res => {
                if (res.data) {
                    res.data.quarters.map(quarter => {
                        quarter.hovered = false;
                        quarter.deleting = false;
                    });

                    this.notes = res.data.notes;
                    this.quarters = res.data.quarters;
                    
                    this.loading = false;
                    this.updateDailyTotal();
                } else {
                    this.loading = false;
                    this.swalError("Virhe!", "Jokin meni pieleen. Koita päivittää selainikkuna ja kirjautua uudelleen sisään.")
                }
            }).catch(err => {                    
                this.swalError("Virhe!", "Jokin meni pieleen. Koita päivittää selainikkuna ja kirjautua uudelleen sisään.")
            });
    
        },
        saveNotes: function() {
            axios.post("/notes", {
                day: this.selectedDate,
                notes: this.notes,
                quarters: this.quarters,     
                dailyTotal: this.dailyTotalAsDecimal                  
            })
            .then(res => {
                this.swalSuccess("Tallennettu")
            })
            .catch(err => {
                this.swalError("Virhe!", "Päivitä selain ja yritä tallentaa muistiinpanot uudelleen.")
            })
        },
        refresh: function() {
            this.selectedDay = this.selectedDate.get("date");
            this.selectedMonth = this.selectedDate.get("month");
            this.selectedYear = this.selectedDate.get("year");
            this.daysInSelectedMonth = this.selectedDate.daysInMonth();
            this.emptyDaysBeforeStart = emptyDaysBeforeStart(this.selectedMonth, this.selectedYear);

            this.fetchDay(this.selectedDate);
        },
        minusMonth: function() {
            this.selectedDate.set("date", 1);
            this.selectedDate.subtract(1, "month");
            this.refresh();
        },
        plusMonth: function () {
            this.selectedDate.set("date", 1);
            this.selectedDate.add(1, "month");
            this.refresh();
        },
        plusDay: function() {
            this.selectedDate.add(1, "day");
            this.refresh();
        },
        minusDay: function() {
            this.selectedDate.subtract(1, "day");
            this.refresh();
        },
        getStartTime: function(quarterNumber) {
            var quarterNumberAsParsedString = String((quarterNumber/4).toFixed(2));
            var parsedQNAPS = quarterNumberAsParsedString.split(".");
            parsedQNAPS[1] = parsedQNAPS[1] / 100 * 60;

            if (parsedQNAPS[0] <= 9) {
                parsedQNAPS[0] = "0" + parsedQNAPS[0];
            }

            if (parsedQNAPS[1] == 0) {
                parsedQNAPS[1] = "00";
            }

            return parsedQNAPS = (String(parsedQNAPS)).replace(",", ":");
        },
        getEndTime: function(quarterNumber) {
            var quarterNumberAsParsedString = String(((quarterNumber + 1)/4).toFixed(2));
            var parsedQNAPS = quarterNumberAsParsedString.split(".");
            parsedQNAPS[1] = parsedQNAPS[1] / 100 * 60;

            if (parsedQNAPS[0] <= 9) {
                parsedQNAPS[0] = "0" + parsedQNAPS[0];
            }

            if (parsedQNAPS[1] == 0) {
                parsedQNAPS[1] = "00";
            }

            return parsedQNAPS = (String(parsedQNAPS)).replace(",", ":");
        },
        getTimeAndEnding: (quarterNumber) => {
            var quarterNumberAsParsedString = String((quarterNumber/4).toFixed(2));
            var quarterNumberAsParsedStringPlus15 = (String(((quarterNumber + 1)/4).toFixed(2)));
            var firstClickedquarterNumberAsParsedString = (String(((quarterNumber + 1)/4).toFixed(2)));

            var parsedQNAPS = quarterNumberAsParsedString.split(".");
            var parsedQNAPSP15 = quarterNumberAsParsedStringPlus15.split(".");
            var parsedFCQNAPS = firstClickedquarterNumberAsParsedString.split(".");

            parsedQNAPS[1] = parsedQNAPS[1] / 100 * 60;
            parsedQNAPSP15[1] = parsedQNAPSP15[1] / 100 * 60;
            parsedFCQNAPS[1] = parsedFCQNAPS[1] / 100 * 60;

            if (parsedQNAPS[0] <= 9) {
                parsedQNAPS[0] = "0" + parsedQNAPS[0];
            }

            if (parsedQNAPS[1] == 0) {
                parsedQNAPS[1] = "00";
            }

            if (parsedQNAPSP15[1] == 0) {
                parsedQNAPSP15[1] = "00";
            }

            if (parsedQNAPSP15[0] <= 9) {
                parsedQNAPSP15[0] = "0" + parsedQNAPSP15[0];
            }

            if (parsedFCQNAPS[1] == 0) {
                parsedFCQNAPS[1] = "00";
            }

            if (parsedFCQNAPS[0] <= 9) {
                parsedFCQNAPS[0] = "0" + parsedFCQNAPS[0];
            }

            parsedQNAPS = (String(parsedQNAPS)).replace(",", ":");
            parsedQNAPSP15 = (String(parsedQNAPSP15)).replace(",", ":");
            parsedFCQNAPS = (String(parsedFCQNAPS)).replace(",", ":");

            return ((this.clicks == 1) ? parsedFCQNAPS : parsedQNAPS) + "–" + parsedQNAPSP15;
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
        },
        leftPad
    },
    created() {
        /**
         * Fetch the user ID so we can use that later
         */
        this.fetchUser();        
        this.fetchDay(this.selectedDate);
    },
    mounted() {
        this.$on('selectDay', (day) => {
            this.selectedDate = moment(new Date(this.selectedYear, this.selectedMonth, day, 12));
            this.refresh();
        });

        this.$on("quarterHovered", id => {
            if (this.clicks == 1) {
                this.secondClickedQuarter = id;
                var sortedQuarters = returnSmallerAndBiggerId(this.firstClickedQuarter, this.secondClickedQuarter);
                var smallerId = sortedQuarters[0], biggerId = sortedQuarters[1];

                for (var i = 0; i < this.quarters.length; i++) {
                    this.quarters[i].hovered = (i > smallerId && i < biggerId) ? true: false;
                    this.quarters[i].deleting = ( (i >= smallerId && i <= biggerId) && this.deleting) ? true: false;
                }
            }
        });

        this.$on("quarterExited", id => {
            for (var i = 0; i < this.quarters.length; i++) {
                this.quarters[i].hovered = false;
                this.quarters[i].deleting = false;
            }
        })

        this.$on('quarterClicked', id => {
            if (this.clicks == 0) {
                this.quarters[id].painted = true;
                this.quarters[id].deleting = (this.deleting) ? true : false;
                this.firstClickedQuarter = id;
                this.clicks++;
            } else if (this.clicks == 1) {
                this.secondClickedQuarter = id;            
                
                var sortedQuarters = returnSmallerAndBiggerId(this.firstClickedQuarter, this.secondClickedQuarter);
                var smallerId = sortedQuarters[0], biggerId = sortedQuarters[1];

                if (this.deleting) {
                    for (var i = smallerId; i <= biggerId; i++) {
                        this.quarters[i].painted = false;
                        this.quarters[i].deleting = false;
                        this.quarters[i].hovered = false;
                    }
                } else {
                    for (var i = smallerId; i <= biggerId; i++) {
                        this.quarters[i].painted = true;
                    }
                }

                this.clicks = 0;
                this.deleting = false;
                this.loading = true;
                this.updateDailyTotal();

                axios.post("/days", {
                    quarters: this.quarters,
                    day: this.selectedDate,
                    dailyTotal: this.dailyTotalAsDecimal,
                    notes: this.notes
                })
                .then(res => {
                    this.loading = false;
                    this.swalSuccess("Tallennettu");
                })
                .catch(err => {
                    this.swalError("Virhe!", "Tiedot eivät tallentuneet. Yritä uudelleen tai päivitä selainikkuna.");
                    this.loading = false;
                });

                this.firstClickedQuarter = 0;
                this.secondClickedQuarter = 0;
            }
        });
    }
}

</script>