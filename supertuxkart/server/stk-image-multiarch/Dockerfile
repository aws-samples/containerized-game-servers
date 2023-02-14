FROM 441218111557.dkr.ecr.us-west-2.amazonaws.com/baseimage:multiarch-py3
ARG SVN_STK
ENV SVN_STK=https://svn.code.sf.net/p/supertuxkart/code/stk-assets
RUN svn cleanup https://svn.code.sf.net/p/supertuxkart/code/stk-assets
RUN svn checkout https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets

ARG GITHUB_STK_BRANCH
ENV GITHUB_STK_BRANCH=master

ARG GITHUB_STK
ENV GITHUB_STK=https://github.com/yahavb/stk-code

RUN git clone https://github.com/yahavb/stk-code stk-code --branch master && \
    cd stk-code && \
    mkdir cmake_build && \
    cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON && \
    cd cmake_build && \
    make -j$(nproc) -f ./Makefile install
