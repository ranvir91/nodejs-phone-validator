// generate random 6 digit code here
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit code
}

export  { generateCode }
