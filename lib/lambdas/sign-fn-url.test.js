"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sign_fn_url_1 = require("./sign-fn-url");
describe('LambdaOriginRequestIamAuth', () => {
    test('signRequest should add x-amz headers', async () => {
        // dummy AWS credentials
        process.env = { ...process.env, ...getFakeAwsCreds() };
        const event = getFakePageRequest();
        const request = event.Records[0].cf.request;
        await (0, sign_fn_url_1.signRequest)(request);
        const securityHeaders = ['x-amz-date', 'x-amz-security-token', 'x-amz-content-sha256', 'authorization'];
        const hasSignedHeaders = securityHeaders.every((h) => h in request.headers);
        expect(hasSignedHeaders).toBe(true);
    });
    test('getRegionFromLambdaUrl should correctly get region', () => {
        const event = getFakePageRequest();
        const request = event.Records[0].cf.request;
        const actual = (0, sign_fn_url_1.getRegionFromLambdaUrl)(request.origin?.custom?.domainName || '');
        expect(actual).toBe('us-east-1');
    });
});
function getFakePageRequest() {
    return {
        Records: [
            {
                cf: {
                    config: {
                        distributionDomainName: 'd6b8brjqfujeb.cloudfront.net',
                        distributionId: 'EHX2SDUU61T7U',
                        eventType: 'origin-request',
                        requestId: '',
                    },
                    request: {
                        clientIp: '1.1.1.1',
                        headers: {
                            host: [
                                {
                                    key: 'Host',
                                    value: 'd6b8brjqfujeb.cloudfront.net',
                                },
                            ],
                            'accept-language': [
                                {
                                    key: 'Accept-Language',
                                    value: 'en-US,en;q=0.9',
                                },
                            ],
                            referer: [
                                {
                                    key: 'Referer',
                                    value: 'https://d6b8brjqfujeb.cloudfront.net/some/path',
                                },
                            ],
                            'x-forwarded-for': [
                                {
                                    key: 'X-Forwarded-For',
                                    value: '1.1.1.1',
                                },
                            ],
                            'user-agent': [
                                {
                                    key: 'User-Agent',
                                    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                                },
                            ],
                            via: [
                                {
                                    key: 'Via',
                                    value: '2.0 8bf94e29f889f8d0076c4502ae008b58.cloudfront.net (CloudFront)',
                                },
                            ],
                            'accept-encoding': [
                                {
                                    key: 'Accept-Encoding',
                                    value: 'br,gzip',
                                },
                            ],
                            'sec-ch-ua': [
                                {
                                    key: 'sec-ch-ua',
                                    value: '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                                },
                            ],
                        },
                        method: 'GET',
                        querystring: '',
                        uri: '/some/path',
                        origin: {
                            custom: {
                                customHeaders: {},
                                domainName: 'kjtbbx7u533q7p7n5font6gpci0phrng.lambda-url.us-east-1.on.aws',
                                keepaliveTimeout: 5,
                                path: '',
                                port: 443,
                                protocol: 'https',
                                readTimeout: 30,
                                sslProtocols: ['TLSv1.2'],
                            },
                        },
                        body: {
                            action: 'read-only',
                            data: '',
                            encoding: 'base64',
                            inputTruncated: false,
                        },
                    },
                },
            },
        ],
    };
}
function getFakeAwsCreds() {
    return {
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'ZSBAT5GENDHC3XYRH36I',
        AWS_SECRET_ACCESS_KEY: 'jpWfApw1AO0xzGZeeT1byQq1zqfQITVqVhTkkql4',
        AWS_SESSION_TOKEN: 'ZQoJb3JpZ2luX2VjEFgaCXVzLWVhc3QtMSJGMEQCIHijzdTXh59aSe2hRfCWpFd2/jacPUC+8rCq3qBIiuG2AiAGX8jqld+p04nPYfuShi1lLN/Z1hEXG9QSNEmEFLTxGSqmAgiR//////////8BEAIaDDI2ODkxNDQ2NTIzMSIMrAMO5/GTvMgoG+chKvoB4f4V1TfkZiHOlmeMK6Ep58mav65A0WU3K9WPzdrJojnGqqTuS85zTlKhm3lfmMxCOtwS/OlOuiBQ1MZNlksK2je1FazgbXN46fNSi+iHiY9VfyRAd0wSLmXB8FFrCGsU92QOy/+deji0qIVadsjEyvBRxzQj5oIUI5sb74Yt7uNvka9fVZcT4s4IndYda0N7oZwIrApCuzzBMuoMAhabmgVrZTbiLmvOiFHS2XZWBySABdygqaIzfV7G4hjckvcXhtxpkw+HJUZTNzVUlspghzte1UG6VvIRV8ax3kWA3zqm8nA/1gHkl40DubJIXz1AJbg5Cps5moE1pjD7vNijBjqeAZh0Q/e0awIHnV4dXMfXUu5mWJ7Db9K1eUlSSL9FyiKeKd94HEdrbIrnPuIWVT/I/5RjNm7NgPYiqmpyx3fSpVcq9CKws0oEfBw6J9Hxk0IhV8yWFZYNMWIarUUZdmL9vVeJmFZmwyL4JjY1s/SZIU/oa8DtvkmP4RG4tTJfpyyhoKL0wJOevkYyoigNllBlLN59SZAT8CCADpN/B+sK',
    };
}
// function getFakeImageEvent(): CloudFrontRequestEvent {
//   return {
//     Records: [
//       {
//         cf: {
//           config: {
//             distributionDomainName: 'd6b8brjqfujeb.cloudfront.net',
//             distributionId: 'EHX2SDUU61T7U',
//             eventType: 'origin-request',
//             requestId: '',
//           },
//           request: {
//             body: {
//               action: 'read-only',
//               data: '',
//               encoding: 'base64',
//               inputTruncated: false,
//             },
//             clientIp: '35.148.139.0',
//             headers: {
//               accept: [
//                 {
//                   key: 'Accept',
//                   value:
//                     'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//                 },
//               ],
//               'x-forwarded-for': [
//                 {
//                   key: 'X-Forwarded-For',
//                   value: '35.148.139.0',
//                 },
//               ],
//               'user-agent': [
//                 {
//                   key: 'User-Agent',
//                   value: 'Amazon CloudFront',
//                 },
//               ],
//               via: [
//                 {
//                   key: 'Via',
//                   value: '2.0 56233ac1c78ee7b920e664cc0c7f287e.cloudfront.net (CloudFront)',
//                 },
//               ],
//               'accept-encoding': [
//                 {
//                   key: 'Accept-Encoding',
//                   value: 'br,gzip',
//                 },
//               ],
//               host: [
//                 {
//                   key: 'Host',
//                   value: 'lqlihcxizzcsefhpfcx2rnkgnu0pzrar.lambda-url.us-east-1.on.aws',
//                 },
//               ],
//             },
//             method: 'GET',
//             origin: {
//               custom: {
//                 customHeaders: {},
//                 domainName: 'lqlihcxizzcsefhpfcx2rnkgnu0pzrar.lambda-url.us-east-1.on.aws',
//                 keepaliveTimeout: 5,
//                 path: '',
//                 port: 443,
//                 protocol: 'https',
//                 readTimeout: 30,
//                 sslProtocols: ['TLSv1.2'],
//               },
//             },
//             querystring: 'url=%2Fprince-akachi-LWkFHEGpleE-unsplash.jpg&w=96&q=75&badParam=bad',
//             uri: '/_next/image',
//           },
//         },
//       },
//     ],
//   };
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbi1mbi11cmwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sYW1iZGFzL3NpZ24tZm4tdXJsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQ0FBb0U7QUFFcEUsUUFBUSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtJQUMxQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsd0JBQXdCO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlLEVBQUUsRUFBRSxDQUFDO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLGtCQUFrQixFQUFFLENBQUM7UUFDbkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQzVDLE1BQU0sSUFBQSx5QkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLE1BQU0sZUFBZSxHQUFHLENBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3hHLE1BQU0sZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1RSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsb0RBQW9ELEVBQUUsR0FBRyxFQUFFO1FBQzlELE1BQU0sS0FBSyxHQUFHLGtCQUFrQixFQUFFLENBQUM7UUFDbkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQzVDLE1BQU0sTUFB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cXVlc3RFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgZ2V0UmVnaW9uRnJvbUxhbWJkYVVybCwgc2lnblJlcXVlc3QgfSBmcm9tICcuL3NpZ24tZm4tdXJsJztcblxuZGVzY3JpYmUoJ0xhbWJkYU9yaWdpblJlcXVlc3RJYW1BdXRoJywgKCkgPT4ge1xuICB0ZXN0KCdzaWduUmVxdWVzdCBzaG91bGQgYWRkIHgtYW16IGhlYWRlcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gZHVtbXkgQVdTIGNyZWRlbnRpYWxzXG4gICAgcHJvY2Vzcy5lbnYgPSB7IC4uLnByb2Nlc3MuZW52LCAuLi5nZXRGYWtlQXdzQ3JlZHMoKSB9O1xuICAgIGNvbnN0IGV2ZW50ID0gZ2V0RmFrZVBhZ2VSZXF1ZXN0KCk7XG4gICAgY29uc3QgcmVxdWVzdCA9IGV2ZW50LlJlY29yZHNbMF0uY2YucmVxdWVzdDtcbiAgICBhd2FpdCBzaWduUmVxdWVzdChyZXF1ZXN0KTtcbiAgICBjb25zdCBzZWN1cml0eUhlYWRlcnMgPSBbJ3gtYW16LWRhdGUnLCAneC1hbXotc2VjdXJpdHktdG9rZW4nLCAneC1hbXotY29udGVudC1zaGEyNTYnLCAnYXV0aG9yaXphdGlvbiddO1xuICAgIGNvbnN0IGhhc1NpZ25lZEhlYWRlcnMgPSBzZWN1cml0eUhlYWRlcnMuZXZlcnkoKGgpID0+IGggaW4gcmVxdWVzdC5oZWFkZXJzKTtcbiAgICBleHBlY3QoaGFzU2lnbmVkSGVhZGVycykudG9CZSh0cnVlKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0UmVnaW9uRnJvbUxhbWJkYVVybCBzaG91bGQgY29ycmVjdGx5IGdldCByZWdpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgZXZlbnQgPSBnZXRGYWtlUGFnZVJlcXVlc3QoKTtcbiAgICBjb25zdCByZXF1ZXN0ID0gZXZlbnQuUmVjb3Jkc1swXS5jZi5yZXF1ZXN0O1xuICAgIGNvbnN0IGFjdHVhbCA9IGdldFJlZ2lvbkZyb21MYW1iZGFVcmwocmVxdWVzdC5vcmlnaW4/LmN1c3RvbT8uZG9tYWluTmFtZSB8fCAnJyk7XG4gICAgZXhwZWN0KGFjdHVhbCkudG9CZSgndXMtZWFzdC0xJyk7XG4gIH0pO1xufSk7XG5cbmZ1bmN0aW9uIGdldEZha2VQYWdlUmVxdWVzdCgpOiBDbG91ZEZyb250UmVxdWVzdEV2ZW50IHtcbiAgcmV0dXJuIHtcbiAgICBSZWNvcmRzOiBbXG4gICAgICB7XG4gICAgICAgIGNmOiB7XG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBkaXN0cmlidXRpb25Eb21haW5OYW1lOiAnZDZiOGJyanFmdWplYi5jbG91ZGZyb250Lm5ldCcsXG4gICAgICAgICAgICBkaXN0cmlidXRpb25JZDogJ0VIWDJTRFVVNjFUN1UnLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiAnb3JpZ2luLXJlcXVlc3QnLFxuICAgICAgICAgICAgcmVxdWVzdElkOiAnJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgIGNsaWVudElwOiAnMS4xLjEuMScsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIGhvc3Q6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBrZXk6ICdIb3N0JyxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiAnZDZiOGJyanFmdWplYi5jbG91ZGZyb250Lm5ldCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgJ2FjY2VwdC1sYW5ndWFnZSc6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBrZXk6ICdBY2NlcHQtTGFuZ3VhZ2UnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdlbi1VUyxlbjtxPTAuOScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmVmZXJlcjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGtleTogJ1JlZmVyZXInLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdodHRwczovL2Q2YjhicmpxZnVqZWIuY2xvdWRmcm9udC5uZXQvc29tZS9wYXRoJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAneC1mb3J3YXJkZWQtZm9yJzogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGtleTogJ1gtRm9yd2FyZGVkLUZvcicsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogJzEuMS4xLjEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICd1c2VyLWFnZW50JzogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGtleTogJ1VzZXItQWdlbnQnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6XG4gICAgICAgICAgICAgICAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTEzLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHZpYTogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGtleTogJ1ZpYScsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogJzIuMCA4YmY5NGUyOWY4ODlmOGQwMDc2YzQ1MDJhZTAwOGI1OC5jbG91ZGZyb250Lm5ldCAoQ2xvdWRGcm9udCknLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICdhY2NlcHQtZW5jb2RpbmcnOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAga2V5OiAnQWNjZXB0LUVuY29kaW5nJyxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiAnYnIsZ3ppcCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgJ3NlYy1jaC11YSc6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBrZXk6ICdzZWMtY2gtdWEnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdcIkdvb2dsZSBDaHJvbWVcIjt2PVwiMTEzXCIsIFwiQ2hyb21pdW1cIjt2PVwiMTEzXCIsIFwiTm90LUEuQnJhbmRcIjt2PVwiMjRcIicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgcXVlcnlzdHJpbmc6ICcnLFxuICAgICAgICAgICAgdXJpOiAnL3NvbWUvcGF0aCcsXG4gICAgICAgICAgICBvcmlnaW46IHtcbiAgICAgICAgICAgICAgY3VzdG9tOiB7XG4gICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczoge30sXG4gICAgICAgICAgICAgICAgZG9tYWluTmFtZTogJ2tqdGJieDd1NTMzcTdwN241Zm9udDZncGNpMHBocm5nLmxhbWJkYS11cmwudXMtZWFzdC0xLm9uLmF3cycsXG4gICAgICAgICAgICAgICAga2VlcGFsaXZlVGltZW91dDogNSxcbiAgICAgICAgICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgICAgICAgICBwb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6ICdodHRwcycsXG4gICAgICAgICAgICAgICAgcmVhZFRpbWVvdXQ6IDMwLFxuICAgICAgICAgICAgICAgIHNzbFByb3RvY29sczogWydUTFN2MS4yJ10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBhY3Rpb246ICdyZWFkLW9ubHknLFxuICAgICAgICAgICAgICBkYXRhOiAnJyxcbiAgICAgICAgICAgICAgZW5jb2Rpbmc6ICdiYXNlNjQnLFxuICAgICAgICAgICAgICBpbnB1dFRydW5jYXRlZDogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldEZha2VBd3NDcmVkcygpIHtcbiAgcmV0dXJuIHtcbiAgICBBV1NfUkVHSU9OOiAndXMtZWFzdC0xJyxcbiAgICBBV1NfQUNDRVNTX0tFWV9JRDogJ1pTQkFUNUdFTkRIQzNYWVJIMzZJJyxcbiAgICBBV1NfU0VDUkVUX0FDQ0VTU19LRVk6ICdqcFdmQXB3MUFPMHh6R1plZVQxYnlRcTF6cWZRSVRWcVZoVGtrcWw0JyxcbiAgICBBV1NfU0VTU0lPTl9UT0tFTjpcbiAgICAgICdaUW9KYjNKcFoybHVYMlZqRUZnYUNYVnpMV1ZoYzNRdE1TSkdNRVFDSUhpanpkVFhoNTlhU2UyaFJmQ1dwRmQyL2phY1BVQys4ckNxM3FCSWl1RzJBaUFHWDhqcWxkK3AwNG5QWWZ1U2hpMWxMTi9aMWhFWEc5UVNORW1FRkxUeEdTcW1BZ2lSLy8vLy8vLy8vLzhCRUFJYURESTJPRGt4TkRRMk5USXpNU0lNckFNTzUvR1R2TWdvRytjaEt2b0I0ZjRWMVRma1ppSE9sbWVNSzZFcDU4bWF2NjVBMFdVM0s5V1B6ZHJKb2puR3FxVHVTODV6VGxLaG0zbGZtTXhDT3R3Uy9PbE91aUJRMU1aTmxrc0syamUxRmF6Z2JYTjQ2Zk5TaStpSGlZOVZmeVJBZDB3U0xtWEI4RkZyQ0dzVTkyUU95LytkZWppMHFJVmFkc2pFeXZCUnh6UWo1b0lVSTVzYjc0WXQ3dU52a2E5ZlZaY1Q0czRJbmRZZGEwTjdvWndJckFwQ3V6ekJNdW9NQWhhYm1nVnJaVGJpTG12T2lGSFMyWFpXQnlTQUJkeWdxYUl6ZlY3RzRoamNrdmNYaHR4cGt3K0hKVVpUTnpWVWxzcGdoenRlMVVHNlZ2SVJWOGF4M2tXQTN6cW04bkEvMWdIa2w0MER1YkpJWHoxQUpiZzVDcHM1bW9FMXBqRDd2TmlqQmpxZUFaaDBRL2UwYXdJSG5WNGRYTWZYVXU1bVdKN0RiOUsxZVVsU1NMOUZ5aUtlS2Q5NEhFZHJiSXJuUHVJV1ZUL0kvNVJqTm03TmdQWWlxbXB5eDNmU3BWY3E5Q0t3czBvRWZCdzZKOUh4azBJaFY4eVdGWllOTVdJYXJVVVpkbUw5dlZlSm1GWm13eUw0SmpZMXMvU1pJVS9vYThEdHZrbVA0Ukc0dFRKZnB5eWhvS0wwd0pPZXZrWXlvaWdObGxCbExONTlTWkFUOENDQURwTi9CK3NLJyxcbiAgfTtcbn1cblxuLy8gZnVuY3Rpb24gZ2V0RmFrZUltYWdlRXZlbnQoKTogQ2xvdWRGcm9udFJlcXVlc3RFdmVudCB7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgUmVjb3JkczogW1xuLy8gICAgICAge1xuLy8gICAgICAgICBjZjoge1xuLy8gICAgICAgICAgIGNvbmZpZzoge1xuLy8gICAgICAgICAgICAgZGlzdHJpYnV0aW9uRG9tYWluTmFtZTogJ2Q2YjhicmpxZnVqZWIuY2xvdWRmcm9udC5uZXQnLFxuLy8gICAgICAgICAgICAgZGlzdHJpYnV0aW9uSWQ6ICdFSFgyU0RVVTYxVDdVJyxcbi8vICAgICAgICAgICAgIGV2ZW50VHlwZTogJ29yaWdpbi1yZXF1ZXN0Jyxcbi8vICAgICAgICAgICAgIHJlcXVlc3RJZDogJycsXG4vLyAgICAgICAgICAgfSxcbi8vICAgICAgICAgICByZXF1ZXN0OiB7XG4vLyAgICAgICAgICAgICBib2R5OiB7XG4vLyAgICAgICAgICAgICAgIGFjdGlvbjogJ3JlYWQtb25seScsXG4vLyAgICAgICAgICAgICAgIGRhdGE6ICcnLFxuLy8gICAgICAgICAgICAgICBlbmNvZGluZzogJ2Jhc2U2NCcsXG4vLyAgICAgICAgICAgICAgIGlucHV0VHJ1bmNhdGVkOiBmYWxzZSxcbi8vICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICBjbGllbnRJcDogJzM1LjE0OC4xMzkuMCcsXG4vLyAgICAgICAgICAgICBoZWFkZXJzOiB7XG4vLyAgICAgICAgICAgICAgIGFjY2VwdDogW1xuLy8gICAgICAgICAgICAgICAgIHtcbi8vICAgICAgICAgICAgICAgICAgIGtleTogJ0FjY2VwdCcsXG4vLyAgICAgICAgICAgICAgICAgICB2YWx1ZTpcbi8vICAgICAgICAgICAgICAgICAgICAgJ3RleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LGltYWdlL2F2aWYsaW1hZ2Uvd2VicCxpbWFnZS9hcG5nLCovKjtxPTAuOCxhcHBsaWNhdGlvbi9zaWduZWQtZXhjaGFuZ2U7dj1iMztxPTAuNycsXG4vLyAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgXSxcbi8vICAgICAgICAgICAgICAgJ3gtZm9yd2FyZGVkLWZvcic6IFtcbi8vICAgICAgICAgICAgICAgICB7XG4vLyAgICAgICAgICAgICAgICAgICBrZXk6ICdYLUZvcndhcmRlZC1Gb3InLFxuLy8gICAgICAgICAgICAgICAgICAgdmFsdWU6ICczNS4xNDguMTM5LjAnLFxuLy8gICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgIF0sXG4vLyAgICAgICAgICAgICAgICd1c2VyLWFnZW50JzogW1xuLy8gICAgICAgICAgICAgICAgIHtcbi8vICAgICAgICAgICAgICAgICAgIGtleTogJ1VzZXItQWdlbnQnLFxuLy8gICAgICAgICAgICAgICAgICAgdmFsdWU6ICdBbWF6b24gQ2xvdWRGcm9udCcsXG4vLyAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgXSxcbi8vICAgICAgICAgICAgICAgdmlhOiBbXG4vLyAgICAgICAgICAgICAgICAge1xuLy8gICAgICAgICAgICAgICAgICAga2V5OiAnVmlhJyxcbi8vICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnMi4wIDU2MjMzYWMxYzc4ZWU3YjkyMGU2NjRjYzBjN2YyODdlLmNsb3VkZnJvbnQubmV0IChDbG91ZEZyb250KScsXG4vLyAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgXSxcbi8vICAgICAgICAgICAgICAgJ2FjY2VwdC1lbmNvZGluZyc6IFtcbi8vICAgICAgICAgICAgICAgICB7XG4vLyAgICAgICAgICAgICAgICAgICBrZXk6ICdBY2NlcHQtRW5jb2RpbmcnLFxuLy8gICAgICAgICAgICAgICAgICAgdmFsdWU6ICdicixnemlwJyxcbi8vICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICBdLFxuLy8gICAgICAgICAgICAgICBob3N0OiBbXG4vLyAgICAgICAgICAgICAgICAge1xuLy8gICAgICAgICAgICAgICAgICAga2V5OiAnSG9zdCcsXG4vLyAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2xxbGloY3hpenpjc2VmaHBmY3gycm5rZ251MHB6cmFyLmxhbWJkYS11cmwudXMtZWFzdC0xLm9uLmF3cycsXG4vLyAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgXSxcbi8vICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuLy8gICAgICAgICAgICAgb3JpZ2luOiB7XG4vLyAgICAgICAgICAgICAgIGN1c3RvbToge1xuLy8gICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IHt9LFxuLy8gICAgICAgICAgICAgICAgIGRvbWFpbk5hbWU6ICdscWxpaGN4aXp6Y3NlZmhwZmN4MnJua2dudTBwenJhci5sYW1iZGEtdXJsLnVzLWVhc3QtMS5vbi5hd3MnLFxuLy8gICAgICAgICAgICAgICAgIGtlZXBhbGl2ZVRpbWVvdXQ6IDUsXG4vLyAgICAgICAgICAgICAgICAgcGF0aDogJycsXG4vLyAgICAgICAgICAgICAgICAgcG9ydDogNDQzLFxuLy8gICAgICAgICAgICAgICAgIHByb3RvY29sOiAnaHR0cHMnLFxuLy8gICAgICAgICAgICAgICAgIHJlYWRUaW1lb3V0OiAzMCxcbi8vICAgICAgICAgICAgICAgICBzc2xQcm90b2NvbHM6IFsnVExTdjEuMiddLFxuLy8gICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgIHF1ZXJ5c3RyaW5nOiAndXJsPSUyRnByaW5jZS1ha2FjaGktTFdrRkhFR3BsZUUtdW5zcGxhc2guanBnJnc9OTYmcT03NSZiYWRQYXJhbT1iYWQnLFxuLy8gICAgICAgICAgICAgdXJpOiAnL19uZXh0L2ltYWdlJyxcbi8vICAgICAgICAgICB9LFxuLy8gICAgICAgICB9LFxuLy8gICAgICAgfSxcbi8vICAgICBdLFxuLy8gICB9O1xuLy8gfVxuIl19