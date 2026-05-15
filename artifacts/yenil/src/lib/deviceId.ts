export function getDeviceId(): string {
  let id = localStorage.getItem("yenil_device_id");
  if (!id) {
    id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("yenil_device_id", id);
  }
  return id;
}
