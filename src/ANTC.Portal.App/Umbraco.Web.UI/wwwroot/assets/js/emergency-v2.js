// Native details keep the choices accessible without JavaScript.
document.querySelectorAll('[data-emergency-v2]').forEach(page => {
  const doors = [...page.querySelectorAll('.emergency-door-details')];
  doors.forEach(door => door.addEventListener('toggle', () => {
    if (door.open) doors.filter(other => other !== door).forEach(other => { other.open = false; });
  }));
});
