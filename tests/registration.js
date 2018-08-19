import { ClientFunction } from 'testcafe'
import randomString from '../js/helpers/random-string'
const getLocation = ClientFunction(() => document.location.href)

fixture `Registration`
    .page `http://localhost:3000/sovellus/rekisteroidy`

test('Registering and deleting a user', async t => {
    await t
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