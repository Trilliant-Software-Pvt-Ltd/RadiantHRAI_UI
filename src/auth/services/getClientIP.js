const getClientIp = async () => {
  try {
    const response = await fetch(
      "https://api.ipify.org?format=json"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch IP");
    }

    const data = await response.json();

    return data.ip;
  } catch (error) {
    console.error("Unable to fetch client IP:", error);
    return "";
  }
};

export default getClientIp;