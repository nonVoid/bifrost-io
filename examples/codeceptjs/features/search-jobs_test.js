Feature('Search jobs')

Scenario(`When I search for react jobs I should get matching job offers @search @jobs`, 
async (I) => {
    I.amOnPage('https://jobs.check24.de/')
    I.fillField('body #search', 'react docker')
    I.clickVisible('Job finden') // Depending on the screen size there may be two such elements
    I.waitInUrl('/search')
    I.seeElementInDOM('.filter--section')
    I.seeNumberOfVisibleElements('.vacancy--boxitem', 3)
})

Scenario(`When I search for .NET jobs I should get matching job offers @search @jobs`, 
async (I) => {
    I.amOnPage('https://jobs.check24.de/')
    I.fillField('body #search', 'c#')
    I.clickVisible('Job finden') // Depending on the screen size there may be two such elements
    I.waitInUrl('/search')
    I.seeElementInDOM('.filter--section')
    I.seeNumberOfVisibleElements('.vacancy--boxitem', 6)
})