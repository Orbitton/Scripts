# Amazon ASIN checker
This code has been commissioned to check availability of products on Amazon.

## Premise
A friend had data-entry and upkeep work for products on Amazon. Challenges he faced included a lack of inherent clarity on the availability of his products, as well as "competition" in regards to product data specifications. To perform his tasks, he needed to manually check each product via a manual search.

This tool was created to alleviate the manual labor. Restriction was that it could not depend on any local installations, nor on any external services, to remain complient with IT policies.

## Functionality
The scripts can be used for the following top-level-domains:
* .es
* .fr
* .it
* .uk

A list of space or tab separated ASINs can be entered in the input field. The script will check for existance of the page, redirects to other ASINs, listed name and vendor, and current availability.

## Usage
1. First, use a modern browser (Chrome was used for testing and real-life usage), and navigate to the amazon website of choice.
2. Paste the script in the web developer tools console, and run it.
3. The tool will now appear overlayed on the website.
4. Enter the ASINs in the input field, and click "Check".
5. Each ASIN will now be checked via a direct link. The contents of the returned page are inspected and the results reported.
6. When finished, the results are listed in a table which can be copied and pasted in an Excel file for further processing by the end-user.
