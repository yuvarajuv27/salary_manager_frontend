# Salary Manager — Project Requirements

## Goal

Salary Manager lets a company record employees and calculate monthly pay for legal entities in nine countries. Each time someone uses Get started, they create a new company. Admin and HR maintain that company’s records. Employees never log in.

Each entity has its own pay rules, entered by Admin and HR. On the company’s payday the product calculates a payslip for each employed person for that pay period, stores it, and shows analytics in the entity’s currency and in the company’s primary currency.

The product stores each employee’s bank details for a later payout. It does not send money.

## Functional requirements

### Account and access

**FR-1. Companies.** The installation holds as many companies as people create. Each company has its own Admins, HR users, legal entities, primary currency, and pay schedule (frequency and payday settings). A user belongs to one company. One company cannot see another company’s records.

**FR-2. Get started and sign-in.** Get started and Sign in are always on the screen. Get started collects the company legal name, the primary currency, the pay schedule, and the first Admin’s name, email, and password, creates that company, and signs the Admin in. Onboarding then collects one entity’s name and country before the rest of the app. Signing up again with a new email creates another company. An email already in use is refused. Sign in opens the company that email belongs to. An Admin can list users in their company and create another Admin, or an HR user assigned to exactly one entity of that company, by setting that person’s name, email, and password. That is the invitation. HR cannot use Get started, and HR cannot sign in until that user exists. Two users cannot share an email. HR cannot create or edit users. Changing or removing a user is outside this release.

**FR-3. Admin scope.** An Admin sees their company and every entity of that company. An Admin manages the company legal name, the primary currency, the pay schedule, entities, and users, and can do every HR task on any entity of that company, including that entity’s payslips.

**FR-4. HR scope.** An HR user sees and manages only their entity: employees, salary, revisions, leave, bank details, pay rules, payslips, and that entity’s analytics. HR cannot create an entity, change an entity’s country, change the pay schedule, change the primary currency, or open account analytics.

### Countries, currency, and pay schedule

**FR-5. Countries.** An entity’s country is one of the following. The country sets the payout currency.

| Country | Payout currency |
|---|---|
| India | INR |
| United States | USD |
| United Kingdom | GBP |
| Canada | CAD |
| Japan | JPY |
| Australia | AUD |
| Singapore | SGD |
| Portugal | EUR |
| France | EUR |

**FR-6. Primary currency.** Each company has one primary currency, chosen on Get started from INR, USD, GBP, CAD, JPY, AUD, SGD, and EUR. An Admin of that company can change it later.

**FR-7. Country lock.** Before an entity’s first credited payslip, Admin can change its country, which updates the payout currency. Each existing employee’s bank details must be replaced, in that same change, with a complete set for the new country. After that first credited payslip, the country and currency stay fixed.

**FR-8. Pay schedule.** The company has one pay frequency for every entity: monthly, weekly, or every two weeks (biweekly). Admin sets it on Get started and can change it later. HR cannot. Monthly uses a payroll day from 1 to 31 (default 31); when that day is missing in a short month, that period runs on the month’s last day, and the pay period is the calendar month of the payday. Weekly uses a weekday (Sunday–Saturday); the pay period is the seven calendar days ending on that payday. Biweekly uses a weekday plus an anchor date that places the every-two-weeks cadence; the pay period is the fourteen calendar days ending on that payday. The clock is UTC. There is no company timezone. The run fires at 00:00 UTC as the payday begins, and that period closes then. Edits later that UTC day stay out of the run. The open period keeps a frozen payday. Changing the schedule leaves that frozen date in place and applies from the following payday. A credited period stays closed. At Get started, the first frozen date is the next payday still in the future. If this period’s instant has already passed, this period is not credited. If the process is down at 00:00 UTC, the next wake credits a period whose frozen instant has passed, and it credits that period once. After a run credits, the next frozen payday advances by one month (monthly), seven days (weekly), or fourteen days (biweekly). There is no per-entity disbursement setting and no control to run payroll early.

### Employees, salary, and leave

**FR-9. Employee record.** HR for the entity, and Admin, can create and edit an employee. The employee has a name, a job role, a department, one entity, an inclusive start date, an optional inclusive end date on or after the start date, a required bank-detail set for the entity’s country, and an optional monthly salary in the entity currency. Job role and department are required text. The salary, when set, is zero or greater. An unset salary is not a salary of zero. Job role and department are shown with the employee. Pay uses salary, days, leave, and rules. The employee remains on the entity where they were created. The job role is the person’s job. It is separate from a user’s access role of Admin or HR.

**FR-10. Salary in force.** The open month is the calendar month of the frozen payroll date. That month uses the current monthly salary at the moment the run credits it. Before that month is credited, HR or Admin can correct the amount, and the run uses the corrected amount. A correction aimed at a credited month is refused. A revision saved on any day becomes the current salary on the first day of the next calendar month. The month in which it was saved keeps the salary already in effect. A later revision saved in that same month replaces the earlier one. A revision cannot start later than the next month. When a correction and a revision both set the salary the open month will use, the later save is the one the run reads.

**FR-11. Payable days.** Every calendar day of the pay period is payable, including weekends and days after the payday within that period. A day is unpaid when it falls outside the employment dates or when HR or Admin has marked it as leave. Leave counts only on days the person is employed. A marked leave day is unpaid. Gross is the monthly salary times payable days, divided by the number of calendar days in that pay period, rounded once to the currency’s minor unit, half away from zero. The gross is at least zero. JPY rounds to the yen. The other currencies round to cents.

**FR-12. Closed months.** Leave dates in a month already credited for that employee cannot be added or removed. Salary corrections and revisions leave a credited payslip unchanged.

**FR-13. Delete.** HR for the entity, and Admin, can delete an employee who has no payslip. A skip row does not block that delete, and the employee’s skip rows are removed with the employee. An employee who has a payslip cannot be deleted. Their employment ends by setting an end date.

### Bank details

**FR-14. Fields.** Bank details are part of the employee. Creating an employee requires a complete set for the entity’s country. The field set follows that country. A missing field or a partial set is refused. There is no separate bank record, and the set cannot be cleared. Payroll calculation does not read these fields.

| Country | Fields |
|---|---|
| India | Account holder name, account number, IFSC |
| United States | Account holder name, account number, routing number |
| United Kingdom | Account holder name, account number, sort code |
| Canada | Account holder name, account number, institution number, transit number |
| Japan | Account holder name, account number, bank code, branch code |
| Australia | Account holder name, account number, BSB |
| Singapore | Account holder name, account number, bank code |
| Portugal | Account holder name, IBAN |
| France | Account holder name, IBAN |

**FR-15. Encryption and mask.** Bank details are encrypted at rest on the employee. The account holder name is shown in full. Every other field is shown as a mask of its last four characters. A value shorter than four characters is shown fully masked. Those full values are never shown again, never placed on a payslip, and never included in analytics. Replacing the stored details means entering a new complete set.

### Pay rules and preview

**FR-16. Rule list.** Admin creates an entity with a name and a country. The rule list starts empty and can be saved empty. Choosing a country does not insert rules. HR for that entity, and Admin, can add, edit, reorder, and delete rules.

**FR-17. Rule shape.** Each rule has a name, a side, and an amount. The side is an earning, an employee deduction, or an employer contribution. An earning is a percent of gross greater than 0 and at most 100, with no ceiling and no fixed amount. A deduction or employer contribution is a percent of gross greater than 0 and at most 100, or a fixed amount in the entity currency greater than 0. A percent deduction or employer contribution may have a ceiling greater than 0. A fixed amount has no ceiling. A rule is refused when the name is blank or any amount is outside those bounds. Names such as Base, HRA, and Allowance are earning rule names. The product does not supply those names.

**FR-18. Calculation.** Earning rules split the gross for display. With none, the payslip shows no earnings split. With some, their percents must sum to 100. Each earning line is that percent of gross, rounded once to the currency’s minor unit, half away from zero, and the last earning line in list order is gross minus the earlier earning lines so the lines add up to gross. When the percents do not sum to 100, the preview is refused and the payroll run stores no earning lines. Deductions and employer contributions still run.

Every deduction and employer percent uses the same gross. One line does not reduce the base of the next, and an earning is not a base for a deduction. A ceiling limits the gross that deduction or employer line sees: the base is the smaller of the gross and the ceiling. A percent line is rounded once to the currency’s minor unit, half away from zero. On the payroll day the gross is the prorated salary from FR-11. A fixed employee deduction is applied in full. Net pay is the greater of zero and gross minus employee deductions. A fixed employer amount is added in full. Employer cost is gross plus employer contributions. With no deduction or employer rules, net equals the prorated gross and employer cost equals that gross. A percent may use up to four decimal places.

**FR-19. Preview.** The rule screen shows a preview beside the editor. Admin or HR types a gross and sees the earnings split when those percents sum to 100, then each other line in list order, employee deductions, net, employer contributions, and employer cost. The preview uses the rules on the screen, including unsaved edits, and the typed gross. It does not create a payslip and does not apply day-count proration. Earning percents that are present and do not sum to 100 are refused.

Worked example: gross 10,000, an employee line at 10%, an employer line at 12% with a ceiling of 8,000, and an employee fixed amount of 500. The employee percent is 1,000. The employer line is 960. Net is 8,500. Employer cost is 10,960.

**FR-20. Payslip copy.** The payroll run uses the rules saved at that moment. The payslip stores the day counts, gross, net, employer cost, and one document of the lines: the earnings split when the saved earning percents sum to 100, and each deduction and employer line with the amount it produced. Later edits to rules leave that payslip unchanged.

**FR-21. Delete entity.** Admin can delete an entity that has no payslip. Skip rows do not block that delete and are removed with its employees. That delete removes its rules and its employees. An entity that has a payslip cannot be deleted.

### Payroll run

**FR-22. Who is credited.** On the payroll day the product creates a credited payslip for each employee who was employed on at least one calendar day of that month and has a monthly salary set, including a salary of zero. An employee employed that month with every employed day on leave gets a zero-gross payslip. An employee with no day in the month gets no payslip and no skip row. An employee employed on at least one day of the month with no monthly salary set is skipped, the reason is recorded, and everyone else in the entity is still credited. That skip appears on the month’s payslip list and has no detail page. An entity with no employees produces no payslips.

**FR-23. Closed result.** A credited payslip stays as calculated. The run still credits payslips in the entity currency when the exchange-rate fetch fails.

### Currency conversion

**FR-24. Stored rate.** On the payroll day, for each entity whose currency differs from the primary currency, the product takes the rate from [Frankfurter](https://www.frankfurter.app/) (European Central Bank reference rates) and stores, with that month’s payroll, the rate, the date that rate was published, and the converted gross, net, and employer cost. When the currencies match, the stored rate is 1. When the payroll date has no published rate, the product stores the previous published business day’s rate and that date. These nine currencies are in the Frankfurter set.

**FR-25. Pending and history.** If Frankfurter cannot be reached, the conversion for that entity stays pending. A later payroll run fills it with the rate for the original payroll date. Changing the primary currency applies to future runs. A closed month keeps the conversion it was given.

### Analytics

**FR-26. Entity analytics.** HR sees their entity only. Admin can open any entity. Figures are in the payout currency and show:

- the latest credited month’s headcount, gross, net, and employer cost
- a monthly line of those three amounts for the last 12 credited months, or fewer when fewer months exist
- that month’s employee deductions and employer contributions, totaled by rule name and side

Headcount is the number of payslips, including zero-gross payslips. Skip rows are left out of the headcount and out of the money.

**FR-27. Account analytics.** Admin sees the parent account in the primary currency: the same headline numbers, the same 12-month line, and a bar of employer cost by entity for the latest credited month. An entity whose conversion for that month is pending is omitted from those totals, including headcount, and listed by name. Entities whose rates were stored are included.

**FR-28. Empty analytics.** Before the first credited month, the entity page and the account page show that there is nothing to chart yet.

**FR-29. Payslip screens.** Admin and HR can open a credited month’s payslip list and a detail page for one employee. The detail shows payable days, leave days, days outside employment, gross, the earnings split when it was stored, each stored deduction and employer line and the amount it produced, net, and employer cost. It shows the employee’s current job role and department. Bank fields stay off the payslip. HR sees only their entity. Admin sees every entity.

## Outside this release

- Sending money, bank files, or a payment provider on the payroll day
- An outside system marking pay as credited
- Syncing leave from another system
- Employee login
- Moving an employee from one entity to another
- Countries beyond the nine
- Bracket rules, and rules that depend on an employee field
- A public-holiday calendar
- Paid leave that still pays
- Government filing
- Predefined country rule packs
- Changing or removing a user

## Done when

This release is complete when:

- Get started creates a company and its first Admin, then onboarding collects one entity. Sign in is always available, and a second signup with a new email creates another company
- Admin can add an entity in any of the nine countries, with rules and a gross preview
- Admin can add another Admin, or an HR user for one entity
- HR can keep that entity’s employees, including job role and department, plus salary, next-month revisions, leave, bank details, and rules
- Admin and HR can open a credited month’s payslip list, including skip rows, and a payslip detail page
- Bank details are encrypted at rest and shown only in masked form
- The payroll day credits a month from calendar days, leave, and employment dates, using the saved rules
- Entity and account analytics match FR-26 and FR-27
- A closed month stays unchanged after later edits to salary, leave, rules, bank details, or the primary currency
