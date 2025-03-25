document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("introForm");
    const coursesContainer = document.getElementById("courses");
    const addCourseBtn = document.getElementById("addCourseBtn");
    const resultDiv = document.getElementById("result");

    // Add Course Field
    addCourseBtn.addEventListener("click", () => {
        const div = document.createElement("div");
        div.className = "course-field";

        const input = document.createElement("input");
        input.type = "text";
        input.name = "courses[]";
        input.placeholder = "Course name and reason";
        input.required = true;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-course";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => div.remove());

        div.appendChild(input);
        div.appendChild(deleteBtn);
        coursesContainer.insertBefore(div, addCourseBtn);
    });

    // Handle Delete on initial field
    document.querySelectorAll(".delete-course").forEach(btn => {
        btn.addEventListener("click", e => e.target.parentElement.remove());
    });

    // Handle Submit
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const imageFile = formData.get("image");

        if (!imageFile.name.match(/\.(jpg|jpeg|png)$/i)) {
            alert("Please upload a JPG or PNG image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const imageUrl = event.target.result;

            const name = formData.get("name");
            const mascot = formData.get("mascot");
            const caption = formData.get("caption");
            const personal = formData.get("personal");
            const professional = formData.get("professional");
            const academic = formData.get("academic");
            const webdev = formData.get("webdev");
            const platform = formData.get("platform");
            const funny = formData.get("funny");
            const extra = formData.get("extra");
            const courses = formData.getAll("courses[]");

            const courseList = courses.map(course => `<li>${course}</li>`).join("");

            const resultHTML = `
                <h2>Introduction</h2>

                <figure>
                    <img src="${imageUrl}" alt="${caption}">
                    <figcaption>${caption}</figcaption>
                </figure>

                <p>Welcome to my introduction page!</p>
                <ul>
                    <li><strong>Personal Background:</strong> ${personal}</li>
                    <li><strong>Professional Background:</strong> ${professional}</li>
                    <li><strong>Academic Background:</strong> ${academic}</li>
                    <li><strong>Background in this Subject:</strong> ${webdev}</li>
                    <li><strong>Primary Computer Platform:</strong> ${platform}</li>
                    <li><strong>Courses I’m Taking this semester and Why:</strong>
                        <ul>${courseList}</ul>
                    </li>
                    <li><strong>Interesting thing about me:</strong> ${funny}</li>
                    <li><strong>Extra Info:</strong> ${extra}</li>
                </ul>

                <button id="resetPage">Reset and Try Again</button>
            `;

            form.style.display = "none";
            resultDiv.innerHTML = resultHTML;

            document.getElementById("resetPage").addEventListener("click", () => {
                form.reset();
                resultDiv.innerHTML = "";
                form.style.display = "block";
            });
        };

        reader.readAsDataURL(imageFile);
    });

    // Handle Form Reset
    form.addEventListener("reset", () => {
        setTimeout(() => {
            const extraCourses = document.querySelectorAll(".course-field");
            extraCourses.forEach((el, i) => {
                if (i > 0) el.remove();
            });
        }, 0);
    });
});
