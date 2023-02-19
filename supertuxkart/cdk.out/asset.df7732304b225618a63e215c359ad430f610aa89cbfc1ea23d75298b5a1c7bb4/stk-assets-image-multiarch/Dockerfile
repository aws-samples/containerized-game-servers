FROM 441218111557.dkr.ecr.us-west-2.amazonaws.com/baseimage:multiarch-py3
#ARG SVN_STK
#ENV SVN_STK=https://svn.code.sf.net/p/supertuxkart/code/stk-assets
#RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-aa
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-ab
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-ac
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-ad
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-ae
RUN wget https://supertuxkart-assets.s3.us-west-2.amazonaws.com/stk-assets.part-af
RUN cat stk-assets.part-a* > stk-assets.tar.gz
RUN tar -xf stk-assets.tar.gz
RUN ls /stk-assets/
