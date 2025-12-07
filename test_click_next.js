// This script will be executed in the browser console to click the Next button
const buttons = document.querySelectorAll('button');
for (let btn of buttons) {
  if (btn.textContent.includes('Next')) {
    console.log('Found Next button:', btn);
    btn.click();
    console.log('Clicked Next button');
    break;
  }
}
