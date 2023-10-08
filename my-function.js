exports.handler = async (event) => {
  
  const keyword = event.queryStringParameters && event.queryStringParameters.keyword;
  
  // if there is no keyword, we respond saying there is no keyword
  if(!keyword){
		const response = {
		  statusCode: 400,
		  body: 'There is no keyword. Please put in a keyword.',
		  headers: {
		    'Content-Type': 'text/plain',
		  },
		};
		return response;
  }
  
  // if there is a keyword, it sends a message of me saying the keyword 
  const response = {
    statusCode: 200,
    body: `Ajay says ${keyword}.`,
    headers: {
      'Content-Type': 'text/plain',
    },
  };
  
  return response;
};
