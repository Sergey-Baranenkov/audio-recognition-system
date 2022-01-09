export default function (service: (...params: any) => any) {
  return async (req, h) => {
    try {
      return await service();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
