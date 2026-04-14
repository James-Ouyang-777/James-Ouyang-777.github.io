const logotext = "JAMES";
const meta = {
    title: "James Ouyang",
    description: "I'm James Ouyang",
};

const introdata = {
    title: "Hi 👋, \n I'm James Ouyang",
    animated: {
        first: "I love solving problems",
        // second: "I believe in a promising future for software & AI",
        third: "I build fun (& sometimes useful) projects",
    },
    description: "Computer Science graduate with experience in quantitative analysis, system engineering, and data systems. Check out My Portfolio to see 👇 some of my most interesting work! ",
    your_img_url: "https://i.imgur.com/79m29zq.png",
};

const dataabout = {
    title: "A bit about my self",
    aboutme: "I am a Computer Science graduate from the University of Waterloo with experience in quantitative analysis, system engineering, and data systems. I have worked at companies like Trexquant Investment LP, ODAIA, and Genellipse, where I've developed expertise in LLM integration, ML pipelines, and data analysis. I'm actively seeking full-time opportunities where I can apply my technical skills and contribute to impactful projects.",
};
const worktimeline = [
    {
        jobtitle: "Quantitative Analyst",
        where: "Trexquant Investment LP",
        date: "August 2024 - December 2024",
    },
    {
        jobtitle: "System Engineer",
        where: "ODAIA",
        date: "January 2024 - May 2024",
    },
    {
        jobtitle: "Data Systems Analyst",
        where: "Genellipse",
        date: "September 2022 - December 2023",
    },
    {
    jobtitle: "Data Scientist",
    where: "Transport Canada",
    date: "January 2022 - August 2022",
    },
    {
        jobtitle: "AI Research Intern",
        where: "Microsoft",
        date: "May 2021 - August 2021",
    },
    // {
    //     jobtitle: "Data Engineer",
    //     where: "BMT",
    //     date: "December 2020 - April 2021",
    // },

];

const skills = [{
        name: "Python",
        value: 95,
    },
    {
        name: "SQL",
        value: 90,
    },
    {
        name: "C++",
        value: 85,
    },
    // {
    //     name: "Javascript",
    //     value: 80,
    // },
    // {
    //     name: "React",
    //     value: 70,
    // },

];

const services = [{
        title: "Quantitative Analysis",
        description: "I specialize in quantitative analysis and research, with experience at Trexquant Investment LP analyzing research workflows, optimizing alpha signals, and designing forecasting systems for large stock universes. My work involves improving information ratios and validating performance with live trading data.",
    },
    {
        title: "System Engineering",
        description: "I have experience designing and implementing knowledge-retrieval systems, ML serving architectures, and data pipelines. At ODAIA, I built LangChain + GPT systems for pharmaceutical sales forecasts and re-engineered ML serving architecture to improve cost efficiency by 65%.",
    },
    {
        title: "Data Systems & Analytics",
        description: "I specialize in building information retrieval systems using LlamaIndex and FAISS, analyzing system accuracy issues, and optimizing data ingestion pipelines. My work at Genellipse involved synthesizing SEC filings, insurance policies, and clinical guidelines while reducing false positives by 30%.",
    },
    {
        title: "Machine Learning & AI",
        description: "I have extensive experience with LLM integration, retrieval-augmented pipelines, and ML model optimization. My work spans across finance, healthcare, and pharmaceutical industries, focusing on practical AI applications and system improvements.",
    },
];

const dataportfolio = [
    {
        img: "https://imgur.com/6MESHnF.png",
        description: "The Donna: your very own personal legal secretary chatbot. ",
        link: "/donna",
    },
    {
        img: "https://i.imgur.com/9Txw70T.png",
        description: "Stock Trading Insights",
        link: "https://data-dashboard-777.streamlit.app/",
    },
    
    {
        img: require("./assets/images/icon2.webp"),
        description: "PromptTester: A/B Testing Framework for LLM Prompts",
        link: "https://github.com/James-Ouyang-777/PromptTester",
    },
    // {
    //     img: "https://i.imgur.com/qXwG4y9.png",
    //     description: "Trader AI Repo",
    //     link: "https://github.com/James-Ouyang-777/NEAT-Trader-Sample",
    // },
    // {
    //     img: "https://picsum.photos/400/800/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },


    {
        img: "https://i.imgur.com/OAQPOKI.png",
        description: "Computer Vision Animal Identifier",
        link: "https://github.com/James-Ouyang-777/CVPets",
    },
    {
        img: require("./assets/images/icon1.png"),
        description: "Flappy Bird: A playable Flappy Bird clone built with React + HTML5 Canvas",
        link: "/game",
    },
    {
        img: require("./assets/images/icon1.png"),
        description: "Airplane Landing: A 2D landing simulator — control throttle and pitch to touch down on the runway",
        link: "/airplane",
    },

    // {
    //     img: "https://picsum.photos/400/300/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/700/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },

    // {
    //     img: "https://picsum.photos/400/600/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/300/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/550/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/700/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
];

const contactConfig = {
    YOUR_EMAIL: "j23ouyan@uwaterloo.ca",
    YOUR_FONE: "(647)-890-3584",
    // description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vehicula eu nunc et sollicitudin. Cras pulvinar, nisi at imperdiet pharetra. ",
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_id",
    YOUR_TEMPLATE_ID: "template_id",
    YOUR_USER_ID: "user_id",
};

const DonnaDesc = {
    YOUR_EMAIL: "j23ouyan@uwaterloo.ca",
    YOUR_FONE: "(555)123-4567",
    description: "Have a chat with the fan-favorite legal secretary from the \"Suits\" TV Series." ,
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_id",
    YOUR_TEMPLATE_ID: "template_id",
    YOUR_USER_ID: "user_id",
};

const socialprofils = {
    github: "https://github.com/James-Ouyang-777",
    facebook: "https://facebook.com",
    linkedin: "https://www.linkedin.com/in/james-ouyang/",
    twitter: "https://twitter.com",
    email: "mailto:jamesouyang02@gmail.com"
};
export {
    meta,
    dataabout,
    dataportfolio,
    worktimeline,
    skills,
    services,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
    DonnaDesc
};