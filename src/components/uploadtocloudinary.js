import axios from "axios";

export const uploadToCloudinary = async (file, onProgress,resourceType = 'auto') => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "my_unsigned_preset"); // Replace with your unsigned upload preset
    // formData.append("cloud_name", `${process.env.CLOUD_NAME}`); // Replace with your Cloudinary cloud name
  // setLoading(false)

    const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dmep4qjdi/${resourceType}/upload`, // Replace with your Cloudinary API URL
        formData,
        {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            },
            headers: { "X-Requested-With": "XMLHttpRequest" },
        }
    );
// console.log(response);

    return response.data;
};