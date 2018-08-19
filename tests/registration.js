import { ClientFunction, Selector } from 'testcafe'
import randomString from '../js/helpers/random-string'
const getLocation = ClientFunction(() => document.location.href)

fixture `Registration and general UI`
    .page `http://localhost:3000/sovellus/rekisteroidy`

test('Registering a user through the registration page, clicking through Kalenteri/Raportit/Asetukset and checking that important elements are visible, then deleting the user', async t => {
    await t
        .typeText('input[name=name]', randomString(10))
        .typeText('input[name=email]', randomString(10) + '@gmail.com')
        .typeText('input[name=password]', randomString(16))
        .click('input[name=ehdot]')
        .click('button[type=submit]')
        .click('a[href="/sovellus/"]')
        .expect(Selector('.selectedDayContainer').exists).eql(true)
        .click('a[href="/sovellus/raportit"]')
        .expect(Selector('table#raportti').exists).eql(true)
        .click('a[href="/sovellus/asetukset"]')
        .click('#deleteVerify')
        .setNativeDialogHandler(() => true)
        .click('#deleteUser')

        .expect(getLocation()).eql('http://localhost:3000/sovellus/kayttaja-poistettu')
})

test('Registering a user through the front page, then deleting the user', async t => {
    await t
        .navigateTo('http://localhost:3000')
        .typeText('input[name=name]', randomString(10))
        .typeText('input[name=email]', randomString(10) + '@gmail.com')
        .typeText('input[name=password]', randomString(16))
        .click('input[name=ehdot]')
        .click('button[type=submit]')
        .click('a[href="/sovellus/asetukset"]')
        .click('#deleteVerify')
        .setNativeDialogHandler(() => true)
        .click('#deleteUser')

        .expect(getLocation()).eql('http://localhost:3000/sovellus/kayttaja-poistettu')
})