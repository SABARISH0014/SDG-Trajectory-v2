const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
try {
  console.log('IND:', regionNames.of('IND'));
} catch (e) {
  console.log('Error IND:', e.message);
}
try {
  console.log('IN:', regionNames.of('IN'));
} catch (e) {
  console.log('Error IN:', e.message);
}
