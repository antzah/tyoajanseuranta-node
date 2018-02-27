<template>
    <div class="row">
        <div class="col-lg-3 col-md-4 col-12">
            <div class="calendar">
                <div class="month title">
                    <button @click="minusMonth" class="btn float-left"><i class="fas fa-caret-left"></i></button> 
                    {{ selectedDate.format("MMMM YYYY") }}
                    <button @click="plusMonth" class="btn  float-right"><i class="fas fa-caret-right"></i></button> 
                </div>
                <div class="days">
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
        <div class="col-lg-9 col-md-8 col-12">
            <div class="selectedDayContainer">
                <h3>{{ selectedDate.format("dddd") }} {{ selectedDate.format("D.M.YYYY") }}</h3>
                <button @click="minusDay" type="button" class="btn btn-outline-info btn-sm">Edellinen päivä</button>
                <button @click="plusDay" type="button" class="btn btn-outline-info btn-sm">Seuraava päivä</button>
                <div class="spacer"></div>
                <div class="row">
                    <div class="col-12">
                        <div class="hourIndicator" :key="n" v-for="n in 24">
                            {{ (n < 11) ? "0" + (n-1) : n-1 }}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <vartti 
                            v-for="quarter in quarters" 
                            :key="quarter.id"
                            :clicks="clicks"
                            :painted="quarter.painted"
                            :id="quarter.id"
                            v-tooltip="getTime(quarter.id)"
                        />
                    </div>
                </div>
                <div class="small-spacer"></div>
                <p v-if="clicks == 0">Lisää pätkä klikkaamalla aloitus- ja lopetusaikaa.</p>
                <p v-if="clicks == 1">Valitse vielä lopetusaika.</p>
                <button v-if="!deleting" class="btn btn-danger btn-sm" @click="deleting = true">Poista</button>
                <button v-if="deleting" class="btn btn-secondary btn-sm" @click="deleting = false">Peruuta poistaminen</button>
                <p v-if="deleting && clicks == 0" style="color: red">Valitse poistettavan pätkän alku.</p>
                <p v-if="deleting && clicks == 1" style="color: red">Valitse poistettavan pätkän loppu.</p>
            </div>
        </div>
    </div>
</template>

<script>

import päivä from "./subcomponents/päivä";
import vartti from "./subcomponents/vartti";

function emptyDaysBeforeStart(month, year) {
    var day = moment(new Date(year, month, 1));
    var weekday = day.isoWeekday();
    return weekday - 1;
}

var quarters = [];

for (var i = 0; i < 96; i++) {
    quarters.push({
        "id": i,
        "painted": false
    })
}

export default {
    components: {
        'paiva': päivä,
        'vartti': vartti
    },
    data: function() {
        return {
            "currentDate": moment(),
            "selectedDate": moment(),
            "selectedDay": moment().get("date"),
            "selectedMonth": moment().get("month"),
            "selectedYear": moment().get("year"),
            daysInSelectedMonth: moment().daysInMonth(),    
            "emptyDaysBeforeStart": emptyDaysBeforeStart(moment().get("month"), moment().get("year")),
            "clicks": 0,
            "firstClickedQuarter": 0,
            "secondClickedQuarter": 0,
            "quarters": quarters,
            "deleting": false
        }
    },
    methods: {
        refresh: function() {
            this.selectedDay = this.selectedDate.get("date");
            this.selectedMonth = this.selectedDate.get("month");
            this.selectedYear = this.selectedDate.get("year");
            this.daysInSelectedMonth = this.selectedDate.daysInMonth();
            this.emptyDaysBeforeStart = emptyDaysBeforeStart(this.selectedMonth, this.selectedYear);
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
        getTime: (quarterNumber) => {
            var quarterNumberAsParsedString = String((quarterNumber/4).toFixed(2));
            var quarterNumberAsParsedStringPlus15 = (String(((quarterNumber + 1)/4).toFixed(2)));

            var parsedQNAPS = quarterNumberAsParsedString.split(".");
            var parsedQNAPSP15 = quarterNumberAsParsedStringPlus15.split(".");

            parsedQNAPS[1] = parsedQNAPS[1] / 100 * 60;
            parsedQNAPSP15[1] = parsedQNAPSP15[1] / 100 * 60;

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

            parsedQNAPS = (String(parsedQNAPS)).replace(",", ":");
            parsedQNAPSP15 = (String(parsedQNAPSP15)).replace(",", ":");

            return parsedQNAPS + "–" + parsedQNAPSP15;
        }
    },
    created() {
    },
    mounted() {
        this.$on('selectDay', (day) => {
            this.selectedDate = moment(new Date(this.selectedYear, this.selectedMonth, day));
            this.refresh();
        });

        this.$on('quarterClicked', id => {
            if (this.clicks == 0) {
                this.quarters[id].painted = true;
                this.firstClickedQuarter = id;
                this.clicks++;
            } else if (this.clicks == 1 && this.deleting) {

            } else if (this.clicks == 1) {
                this.secondClickedQuarter = id;            
                
                var smallerId = (this.firstClickedQuarter < this.secondClickedQuarter) ? this.firstClickedQuarter : this.secondClickedQuarter;
                var biggerId = (this.secondClickedQuarter > this.firstClickedQuarter) ? this.secondClickedQuarter : this.firstClickedQuarter; 

                for (var i = smallerId; i <= biggerId; i++) {
                    this.quarters[i].painted = true;
                }

                this.clicks = 0;
            }
        });
    }
}

</script>