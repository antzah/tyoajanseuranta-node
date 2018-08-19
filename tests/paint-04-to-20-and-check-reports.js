import { ClientFunction, Selector } from 'testcafe'
import randomString from '../js/helpers/random-string'
const getLocation = ClientFunction(() => document.location.href)

fixture `Painting hours and checking reports`
    .page `http://localhost:3000/sovellus/rekisteroidy`

test('Paint hours from 04:00 to 20:00 and check that reports are correct', async t => {
    await t
        /**
         * Register the user
         */
        .typeText('input[name=name]', randomString(10))
        .typeText('input[name=email]', randomString(10) + '@gmail.com')
        .typeText('input[name=password]', randomString(16))
        .click('input[name=ehdot]')
        .click('button[type=submit]')

        /**
         * Paint the quarters representing the time period between 04:00 and 20:00
         */
        .click('.quarterHour:nth-of-type(17)')
        .click('.quarterHour:nth-of-type(80)')
        .wait(1000)

        /**
         * Open reports and check that
         * .. total hours = 16
         * .. daytime hours = 12
         * .. evening hours = 2
         * .. nighttime hours = 2
         */
        .click('a[href="/sovellus/raportit"]')
        .expect(Selector('tbody>tr:last-child td:nth-child(3)').textContent).eql('16')
        .expect(Selector('tbody>tr:last-child td:nth-child(4)').textContent).eql('12')
        .expect(Selector('tbody>tr:last-child td:nth-child(5)').textContent).eql('2')
        .expect(Selector('tbody>tr:last-child td:nth-child(6)').textContent).eql('2')

        /**
         * Then delete the user
         */
        .click('a[href="/sovellus/asetukset"]')
        .click('#deleteVerify')
        .setNativeDialogHandler(() => true)
        .click('#deleteUser')

        .expect(getLocation()).eql('http://localhost:3000/sovellus/kayttaja-poistettu')
})

test('Paint hours from 00:00 to 06:00 and check that reports are correct', async t => {
    await t
        /**
         * Register the user
         */
        .typeText('input[name=name]', randomString(10))
        .typeText('input[name=email]', randomString(10) + '@gmail.com')
        .typeText('input[name=password]', randomString(16))
        .click('input[name=ehdot]')
        .click('button[type=submit]')

        /**
         * Paint the quarters representing the time period between 00:00 and 06:00
         */
        .click('.quarterHour:nth-of-type(1)')
        .click('.quarterHour:nth-of-type(24)')
        .wait(1000)

        /**
         * Open reports and check that
         * .. total hours = 6
         * .. daytime hours = 0
         * .. evening hours = 0
         * .. nighttime hours = 6
         */
        .click('a[href="/sovellus/raportit"]')
        .expect(Selector('tbody>tr:last-child td:nth-child(3)').textContent).eql('6')
        .expect(Selector('tbody>tr:last-child td:nth-child(4)').textContent).eql('0')
        .expect(Selector('tbody>tr:last-child td:nth-child(5)').textContent).eql('0')
        .expect(Selector('tbody>tr:last-child td:nth-child(6)').textContent).eql('6')

        /**
         * Then delete the user
         */
        .click('a[href="/sovellus/asetukset"]')
        .click('#deleteVerify')
        .setNativeDialogHandler(() => true)
        .click('#deleteUser')

        .expect(getLocation()).eql('http://localhost:3000/sovellus/kayttaja-poistettu')
})