const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const app = require('../app');

chai.use(chaiHttp);
describe(' Tests for endpoints that have to do with activities', async () => {

    let token;
    const signin = '/users/signin';

    const userCredentials = {
        email: 'runTests@myumanitoba.ca',
        password: 'runTests',
    };

    before(async () => {
        const result = await chai
            .request(app)
            .post(signin)
            .send(userCredentials);
        assert.equal(result.status, '200');
        token = result.body.token;
    });


    describe('GET /activities', () => {
        it('It should GET all the activities for which the date/time of the event has not passed', async () =>  {
            const result = await chai
                .request(app)
                .get('/activities');
            assert.equal(result.status, '200');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'info', 'activities']);
        });
    });

    describe('GET /activities/activity:id', () => {
        it('It should GET the details about an activity specified by the Id successfully', async () => {
            const testSuccessResult = await chai
                .request(app)
                .get('/activities/activity/5c9575ad6394943867f91ccc');
            assert.equal(testSuccessResult.status, '200');
            assert.isObject(testSuccessResult.body);
            assert.hasAllKeys(testSuccessResult.body, ['success', 'info', 'activity']);
            assert.isTrue(testSuccessResult.body.success);
        });

        it('It should give a 500 response since the id provided is invalid', async () => {

            const testInvalidID = await chai
                .request(app)
                .get('/activities/activity/:5c9575ad6394943867f91ccc');
            assert.equal(testInvalidID.status, '500');
            assert.isObject(testInvalidID.body);
            assert.hasAllKeys(testInvalidID.body, ['success', 'info', 'activity']);
            assert.isFalse(testInvalidID.body.success);
        });

        it('It should give a 404 response since no activity in the database has the specified id', async () => {

            const testNonExistingId = await chai.request(app).get('/activities/activity/5c97ce54c7c41320ba3ddb01');
            assert.equal(testNonExistingId.status, '404');
            assert.isObject(testNonExistingId.body);
            assert.hasAllKeys(testNonExistingId.body, ['success', 'info', 'activity']);
            assert.isTrue(testNonExistingId.body.success);
        });

    });


    describe('POST /activities/activity/create', () => {
        it('It should POST the details about an activity and create an Id successfully', async () => {
            const newActivity = {activity_datetime: new Date("2019-05-01 02:04:19.694"),
                                 category: "SPORTS",
                                 description: "Testing creation",
                                 max_attendance: 10,
                                 title: "testRun",
                                 location: "Um Centre"};
            const testSuccessResult = await chai
                .request(app)
                .post('/activities/activity/create')
                .set('Authorization', token)
                .send(newActivity);
            assert.equal(testSuccessResult.status, '200');
            assert.isObject(testSuccessResult.body);
            assert.hasAllKeys(testSuccessResult.body, ['success', 'info', 'activity']);
            assert.isTrue(testSuccessResult.body.success);
        });

        it('It should give a 400 response since the payload provided is missing important fields', async () => {
            const newActivity = {activity_datetime: new Date("2019-05-01 02:04:19.694"),
                                 category: "SPORTS"};
            const testInvalidPayload = await chai
                .request(app)
                .post('/activities/activity/create')
                .set('Authorization', token)
                .send(newActivity);
            assert.equal(testInvalidPayload.status, '400');
            assert.isObject(testInvalidPayload.body);
            assert.hasAllKeys(testInvalidPayload.body, ['success', 'info', 'activity']);
            assert.isNull(testInvalidPayload.body.activity);
            assert.isFalse(testInvalidPayload.body.success);
        });

    });

    describe('GET /activities/activity/sortBy/:category', () => {
        it('It should GET the activities that have the category specified', async () => {
            const testSuccessResult = await chai
                .request(app)
                .get('/activities/activity/sortBy/sports');
            assert.equal(testSuccessResult.status, '200');
            assert.isObject(testSuccessResult.body);
            assert.hasAllKeys(testSuccessResult.body, ['success', 'info', 'activities']);
            assert.isTrue(testSuccessResult.body.success);
            let returnedActivities = testSuccessResult.body.activities;
            let i;
            for (i=0; i<returnedActivities.length; i++){
                assert.equal(returnedActivities[i].category, 'SPORTS');
            }
        });

        it('It should GET the activities that have the category specified. This should be no activities', async () => {
            const testSuccessResult = await chai
                .request(app)
                .get('/activities/activity/sortBy/sps');
            assert.equal(testSuccessResult.status, '200');
            assert.isObject(testSuccessResult.body);
            assert.hasAllKeys(testSuccessResult.body, ['success', 'info', 'activities']);
            assert.isTrue(testSuccessResult.body.success);
            let returnedActivities = testSuccessResult.body.activities;
            assert.equal(returnedActivities.length, 0);
        });
    });

    describe('GET /users/user/activities/attending', () => {
        it('It should GET the activities that the user is attending', async () => {
            const testSuccessResult = await chai
                .request(app)
                .get('/users/user/activities/attending')
                .set('Authorization', token);
            assert.equal(testSuccessResult.status, '200');
            assert.isObject(testSuccessResult.body);
            assert.hasAllKeys(testSuccessResult.body, ['success', 'info', 'activities']);
            assert.isTrue(testSuccessResult.body.success);
            assert.equal(testSuccessResult.body.activities.length, '0');
        });
    });
});


const User = require('../models/users');


describe(' Tests for endpoints that have to do with User Authentication', async () => {

    function randomString(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    const signInCredentials = {
        email: 'runtests1234@myumanitoba.ca',
        password: 'runtests1234',
        username: 'runtests1234'
    };

    let signUpCredentials = {
        username:randomString(Math.floor(Math.random() * 10)+5),
        email: randomString(Math.floor(Math.random() * 10)+5)+"@myumanitoba.ca",
        password: 'thePassword',
    };

    after('Close test db', async () => {
        await User.findOneAndDelete({email:signUpCredentials.email});
        await User.findOneAndDelete({email:signInCredentials.email});
    });


    describe('POST /users/signup', () => {
        it('It should return a 200 response', async () => {
            const result = await chai
                .request(app)
                .post('/users/signup')
                .send(signUpCredentials);
            assert.equal(result.status, '200');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'info', 'token', 'user']);
            assert.isNotNull(result.token);
            assert.isNotNull(result.user);
            assert.equal(result.body.user.email, signUpCredentials.email);
            assert.equal(result.body.user.username, signUpCredentials.username);
        });

        it('It should return a 403 response because the user with those credentials exist already', async () => {
            const result = await chai
                .request(app)
                .post('/users/signup')
                .send(signUpCredentials);
            assert.equal(result.status, '403');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'info', 'token', 'user']);
            assert.isNull(result.body.user);
            assert.isNull(result.body.token);
        });

        it('It should return a 500 response because password field is missing', async () => {
            let customSignUpCredentials = {
                username:randomString(Math.floor(Math.random() * 10)+5),
                email: randomString(Math.floor(Math.random() * 10)+5)+"@myumanitoba.ca",
            };
            const result = await chai
                .request(app)
                .post('/users/signup')
                .send(customSignUpCredentials);
            assert.equal(result.status, '500');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'info', 'token', 'user']);
            assert.isNull(result.body.user);
            assert.isNull(result.body.token);
        });
    });


    describe('POST /users/signin', () => {
        it('It should return a 401 response because the user does not exist.', async () => {
            let customSignInCredentials = {
                password:randomString(Math.floor(Math.random() * 10)+5),
                email: randomString(Math.floor(Math.random() * 10)+5)+"@myumanitoba.ca",
            };
            const result = await chai
                .request(app)
                .post('/users/signin')
                .send(customSignInCredentials);
            assert.equal(result.status, '401');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'info', 'token', 'user']);
            assert.isNull(result.body.user);
            assert.isNull(result.body.token);
        });

        it('It should return a 200 response.', async () => {
            const resultSignup = await chai
                .request(app)
                .post('/users/signup')
                .send(signInCredentials);
            const result = await chai
                .request(app)
                .post('/users/signin')
                .send(signInCredentials);
            assert.equal(result.status, '200');
            assert.isObject(result.body);
            assert.hasAllKeys(result.body, ['success', 'token', 'user']);
            assert.isNotNull(result.body.user);
            assert.isNotNull(result.body.token);

        });
    });

});